import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useApp } from '../context/AppContext'
import PersonItems from '../components/PersonItems'
import UserAvatar from '../components/UserAvatar'
import ProgressTracker from '../components/ProgressTracker'
import Leaderboard from '../components/Leaderboard'
import './Room.css'

function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { rooms, refreshRooms, loading, leaveRoom, deleteRoom, updateRoomName, currentUser } = useApp()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  
  const getToday = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [selectedDate, setSelectedDate] = useState(() => getToday())
  
  useEffect(() => {
    const today = getToday()
    setSelectedDate(today)
  }, [roomId])
  
  useEffect(() => {
    const today = getToday()
    setSelectedDate(today)
  }, [])

  const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
  const roomCreatorId = room?.creatorId || room?.creatorid
  const isCreator = room && currentUser && roomCreatorId === currentUser.id
  const isMember = room && currentUser && room.members && Array.isArray(room.members) && room.members.some(m => m.id === currentUser.id)

  const handleLeaveRoom = async () => {
    if (window.confirm('Are you sure you want to leave this room? Your items will be removed.')) {
      const success = await leaveRoom(roomId)
      if (success) {
        navigate('/')
      }
    }
  }

  const handleDeleteRoom = async () => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      const success = await deleteRoom(roomId)
      if (success) {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    if (rooms.length === 0 && loading) {
      return
    }
    if (rooms.length > 0 && !room) {
      navigate('/')
      return
    }
    if (room && currentUser && (!isMember)) {
      navigate('/')
    }
  }, [rooms, room, navigate, loading, currentUser, isMember])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshRooms()
    }, 5000)
    return () => clearInterval(interval)
  }, [refreshRooms])

  if (loading && rooms.length === 0) {
    return <div className="room-loading">Loading...</div>
  }

  if (!room) {
    return <div className="room-loading">Loading room...</div>
  }

  if (!room.members || !Array.isArray(room.members)) {
    return <div className="room-loading">Loading room data...</div>
  }

  if (!room.items || !Array.isArray(room.items)) {
    room.items = []
  }

  const today = getToday()

  return (
    <div className="room">
      <header className="room-header">
        <div className="room-header-top">
          <Link to="/" className="back-link">
            ← Back
          </Link>
          <div className="header-right">
            <Link to="/dashboard" className="dashboard-link">
              Dashboard
            </Link>
            <div className="user-button-wrapper">
              <UserButton />
            </div>
          </div>
        </div>
        <div className="room-title-section">
          {isEditingName && isCreator ? (
            <form
              className="room-name-edit-form"
              onSubmit={async (e) => {
                e.preventDefault()
                if (editNameValue.trim() && editNameValue.trim() !== room.name) {
                  await updateRoomName(roomId, editNameValue.trim())
                }
                setIsEditingName(false)
                setEditNameValue('')
              }}
            >
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (editNameValue.trim() && editNameValue.trim() !== room.name) {
                      await updateRoomName(roomId, editNameValue.trim())
                    }
                    setIsEditingName(false)
                    setEditNameValue('')
                  }
                  if (e.key === 'Escape') {
                    setIsEditingName(false)
                    setEditNameValue('')
                  }
                }}
                onBlur={async () => {
                  if (editNameValue.trim() && editNameValue.trim() !== room.name) {
                    await updateRoomName(roomId, editNameValue.trim())
                  }
                  setIsEditingName(false)
                  setEditNameValue('')
                }}
                className="room-name-input"
                autoFocus
              />
            </form>
          ) : (
            <h1
              className="room-title"
              onClick={() => {
                if (isCreator) {
                  setEditNameValue(room.name)
                  setIsEditingName(true)
                }
              }}
              style={isCreator ? { cursor: 'pointer' } : {}}
              title={isCreator ? 'Click to edit room name' : ''}
            >
              {room.name}
            </h1>
          )}
          <div className="room-actions">
            {isMember && !isCreator && (
              <button className="leave-room-button" onClick={handleLeaveRoom}>
                Leave Room
              </button>
            )}
            {isCreator && (
              <>
                <button className="delete-room-button" onClick={handleDeleteRoom}>
                  Delete Room
                </button>
              </>
            )}
          </div>
        </div>
        <div className="room-code-section">
          <span className="room-code-label">Room Code:</span>
          <span className="room-code">{room.id}</span>
        </div>
      </header>

      <div className="room-members">
        <h2 className="section-title">Members ({room.members.length}/4)</h2>
        <div className="members-list">
          {room.members.map((member) => (
            <div key={member.id} className="member-item">
              <UserAvatar userId={member.id} name={member.name} />
              <span className="member-name">{member.name}</span>
            </div>
          ))}
        </div>
        {room.members.length >= 4 && (
          <p className="room-full-notice">Room is full (4/4 members)</p>
        )}
      </div>

      <div className="date-selector">
        <label htmlFor="date-picker" className="date-label">
          View Date:
        </label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      <div className="room-items-section">
        <h2 className="section-title">Accountability Items</h2>
        <div className="items-grid">
          {room.members.map((member) => (
            <PersonItems
              key={member.id}
              member={member}
              roomId={roomId}
              selectedDate={selectedDate}
              today={today}
            />
          ))}
        </div>
      </div>

      <div className="room-stats">
        <ProgressTracker room={room} selectedDate={selectedDate} />
        <Leaderboard room={room} selectedDate={selectedDate} />
      </div>
    </div>
  )
}

export default Room

