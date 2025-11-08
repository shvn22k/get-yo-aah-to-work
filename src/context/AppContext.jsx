import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const { user } = useUser()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const recentlyCreatedRooms = useRef(new Set())

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading rooms:', error)
          loadFromLocalStorage()
        } else {
          setRooms(data || [])
        }
      } catch (err) {
        console.error('Error loading rooms:', err)
        loadFromLocalStorage()
      }
    } else {
      loadFromLocalStorage()
    }
    if (showLoading) {
      setLoading(false)
    }
  }

  const refreshRooms = async () => {
    await loadRooms(false)
  }

  const loadFromLocalStorage = () => {
    const savedRooms = localStorage.getItem('accountabilityRooms')
    if (savedRooms) {
      try {
        setRooms(JSON.parse(savedRooms))
      } catch (err) {
        console.error('Error parsing localStorage:', err)
      }
    }
  }

  const saveToLocalStorage = (roomsToSave) => {
    try {
      localStorage.setItem('accountabilityRooms', JSON.stringify(roomsToSave))
    } catch (err) {
      console.error('Error saving to localStorage:', err)
    }
  }

  const createRoom = async (roomName) => {
    if (!user) return null
    
    const roomId = Math.random().toString(36).substring(2, 9)
    const member = {
      id: user.id,
      name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'You',
      email: user.primaryEmailAddress?.emailAddress || ''
    }
    
    const newRoom = {
      id: roomId,
      name: roomName,
      members: [member],
      items: [],
      created_at: new Date().toISOString()
    }

    if (supabase) {
      try {
        const roomToInsert = { 
          ...newRoom,
          creatorid: user.id
        }
        
        const { data, error } = await supabase
          .from('rooms')
          .insert([roomToInsert])
          .select()
          .single()

        if (error) {
          console.error('Error creating room:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          const updatedRooms = [...rooms, { ...newRoom, creatorId: user.id }]
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
          return roomId
        } else {
          const roomWithCreator = { ...data, creatorId: data.creatorid || data.creatorId || user.id }
          
          recentlyCreatedRooms.current.add(roomId)
          setTimeout(() => {
            recentlyCreatedRooms.current.delete(roomId)
          }, 5000)
          
          const updatedRooms = [...rooms, roomWithCreator]
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
          
          setTimeout(async () => {
            const { data: verifyData, error: verifyError } = await supabase
              .from('rooms')
              .select('*')
              .eq('id', roomId)
              .single()
            
            if (verifyError || !verifyData) {
              console.error('Room was deleted after creation!', verifyError)
              if (verifyError?.code === 'PGRST116') {
                console.error('Room not found in database - may have been deleted')
              }
            }
          }, 2000)
          
          return roomId
        }
      } catch (err) {
        console.error('Error creating room:', err)
        const updatedRooms = [...rooms, { ...newRoom, creatorId: user.id }]
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
        return roomId
      }
    } else {
      const updatedRooms = [...rooms, { ...newRoom, creatorId: user.id }]
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }
    
    return roomId
  }

  const joinRoom = async (roomId) => {
    if (!user) {
      console.error('No user found when trying to join room')
      return false
    }
    
    const trimmedRoomId = roomId.trim()
    let room = rooms.find(r => r.id.toLowerCase() === trimmedRoomId.toLowerCase())
    
    if (!room && supabase) {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', trimmedRoomId)
          .single()

        if (error || !data) {
          return false
        }
        room = data
        setRooms([...rooms, room])
      } catch (err) {
        console.error('Error fetching room:', err)
        return false
      }
    }

    if (!room) {
      return false
    }

    const existingMember = room.members.find(m => m.id === user.id)
    if (existingMember) {
      return true
    }

    if (room.members && room.members.length >= 4) {
      return { error: 'Room is full. Maximum 4 members allowed.' }
    }

    const newMember = {
      id: user.id,
      name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'You',
      email: user.primaryEmailAddress?.emailAddress || ''
    }

    const updatedRoom = {
      ...room,
      members: [...room.members, newMember]
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ members: updatedRoom.members })
          .eq('id', trimmedRoomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === trimmedRoomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === trimmedRoomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === trimmedRoomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === trimmedRoomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }

    return true
  }

  const getRoom = (roomId) => {
    if (!roomId) return null
    return rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
  }

  const addItem = async (roomId, itemText, userId, date) => {
    const today = date || new Date().toISOString().split('T')[0]
    const newItem = {
      id: Date.now().toString(),
      text: itemText,
      userId: userId,
      firstDate: today,
      completedDates: {},
      createdAt: new Date().toISOString()
    }

    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return

    const updatedRoom = {
      ...room,
      items: [...room.items, newItem]
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ items: updatedRoom.items })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }
  }

  const checkIn = async (roomId, itemId, userId, date, completed) => {
    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return

    const item = room.items.find(i => i.id === itemId)
    if (!item) return

    const dateKey = date || new Date().toISOString().split('T')[0]
    const updatedCompletedDates = {
      ...(item.completedDates || {}),
      [dateKey]: {
        ...(item.completedDates?.[dateKey] || {}),
        [userId]: completed
      }
    }

    const updatedItem = {
      ...item,
      completedDates: updatedCompletedDates
    }

    const updatedRoom = {
      ...room,
      items: room.items.map(i => i.id === itemId ? updatedItem : i)
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ items: updatedRoom.items })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }
  }

  const updateItem = async (roomId, itemId, newText) => {
    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return

    const updatedRoom = {
      ...room,
      items: room.items.map(i => i.id === itemId ? { ...i, text: newText } : i)
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ items: updatedRoom.items })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }
  }

  const deleteItem = async (roomId, itemId) => {
    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return

    const updatedRoom = {
      ...room,
      items: room.items.filter(i => i.id !== itemId)
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ items: updatedRoom.items })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }
  }

  const leaveRoom = async (roomId) => {
    if (!user) return false

    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return false

    const memberIndex = room.members.findIndex(m => m.id === user.id)
    if (memberIndex === -1) return false

    const updatedMembers = room.members.filter(m => m.id !== user.id)
    const updatedItems = room.items.filter(item => item.userId !== user.id)

    const updatedRoom = {
      ...room,
      members: updatedMembers,
      items: updatedItems
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ members: updatedMembers, items: updatedItems })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }

    return true
  }

  const updateRoomName = async (roomId, newName) => {
    if (!user) return false

    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return false

    const roomCreatorId = room.creatorId || room.creatorid
    if (roomCreatorId !== user.id) {
      return false
    }

    const updatedRoom = {
      ...room,
      name: newName.trim()
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ name: newName.trim() })
          .eq('id', roomId)

        if (error) {
          console.error('Error updating room name:', error)
          const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r))
        }
      } catch (err) {
        console.error('Error updating room name:', err)
        const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.map(r => r.id.toLowerCase() === roomId.toLowerCase() ? updatedRoom : r)
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }

    return true
  }

  const deleteRoom = async (roomId) => {
    if (!user) return false

    const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
    if (!room) return false

    const roomCreatorId = room.creatorId || room.creatorid
    if (roomCreatorId !== user.id) {
      return false
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', roomId)

        if (error) {
          console.error('Error deleting room:', error)
          const updatedRooms = rooms.filter(r => r.id.toLowerCase() !== roomId.toLowerCase())
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms(rooms.filter(r => r.id.toLowerCase() !== roomId.toLowerCase()))
        }
      } catch (err) {
        console.error('Error deleting room:', err)
        const updatedRooms = rooms.filter(r => r.id.toLowerCase() !== roomId.toLowerCase())
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = rooms.filter(r => r.id.toLowerCase() !== roomId.toLowerCase())
      setRooms(updatedRooms)
      saveToLocalStorage(updatedRooms)
    }

    return true
  }

  const getCurrentUser = () => {
    if (!user) return null
    return {
      id: user.id,
      name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'You',
      email: user.primaryEmailAddress?.emailAddress || ''
    }
  }

  useEffect(() => {
    if (!supabase) return

    let isSubscribed = false
    const channel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          if (!isSubscribed) return
          
          const roomId = payload.new?.id || payload.old?.id
          if (roomId && recentlyCreatedRooms.current.has(roomId)) {
            return
          }
          
          if (payload.eventType === 'DELETE') {
            setTimeout(() => {
              refreshRooms()
            }, 1000)
          } else if (payload.eventType === 'UPDATE') {
            setTimeout(() => {
              refreshRooms()
            }, 500)
          } else if (payload.eventType === 'INSERT') {
            setTimeout(() => {
              refreshRooms()
            }, 500)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed = true
        }
      })

    return () => {
      isSubscribed = false
      supabase.removeChannel(channel)
    }
  }, [])

  const value = {
    rooms,
    loading,
    currentUser: getCurrentUser(),
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    updateRoomName,
    getRoom,
    addItem,
    checkIn,
    updateItem,
    deleteItem,
    refreshRooms
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

