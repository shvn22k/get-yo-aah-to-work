import { createContext, useContext, useState, useEffect } from 'react'
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
        const { data, error } = await supabase
          .from('rooms')
          .insert([newRoom])
          .select()
          .single()

        if (error) {
          console.error('Error creating room:', error)
          const updatedRooms = [...rooms, newRoom]
          setRooms(updatedRooms)
          saveToLocalStorage(updatedRooms)
        } else {
          setRooms([...rooms, data])
        }
      } catch (err) {
        console.error('Error creating room:', err)
        const updatedRooms = [...rooms, newRoom]
        setRooms(updatedRooms)
        saveToLocalStorage(updatedRooms)
      }
    } else {
      const updatedRooms = [...rooms, newRoom]
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
          console.log('Room not found in database. Available rooms:', rooms.map(r => r.id))
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
      console.log('Room not found. Available rooms:', rooms.map(r => r.id))
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

  const addItem = async (roomId, itemText, userId) => {
    const newItem = {
      id: Date.now().toString(),
      text: itemText,
      userId: userId,
      checkIns: {},
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

    const updatedCheckIns = {
      ...item.checkIns,
      [date]: {
        ...item.checkIns[date],
        [userId]: completed
      }
    }

    const updatedItem = {
      ...item,
      checkIns: updatedCheckIns
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

  const getCurrentUser = () => {
    if (!user) return null
    return {
      id: user.id,
      name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'You',
      email: user.primaryEmailAddress?.emailAddress || ''
    }
  }

  useEffect(() => {
    if (supabase && rooms.length > 0) {
      const subscription = supabase
        .channel('rooms-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'rooms' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              loadRooms()
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [rooms.length])

  const value = {
    rooms,
    loading,
    currentUser: getCurrentUser(),
    createRoom,
    joinRoom,
    getRoom,
    addItem,
    checkIn,
    updateItem,
    deleteItem,
    refreshRooms
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

