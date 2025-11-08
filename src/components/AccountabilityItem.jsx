import { useState } from 'react'
import { useApp } from '../context/AppContext'
import UserAvatar from './UserAvatar'
import './AccountabilityItem.css'

function AccountabilityItem({ item, roomId, members, selectedDate, today }) {
  const { checkIn, deleteItem, updateItem, currentUser } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const itemOwner = members.find(m => m.id === item.userId)
  const isOwner = currentUser && item.userId === currentUser.id

  const handleCheckIn = (userId, completed) => {
    checkIn(roomId, item.id, userId, selectedDate, completed)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(roomId, item.id)
    }
  }

  const getCheckInStatus = (userId) => {
    const dateCheckIns = item.checkIns[selectedDate]
    if (!dateCheckIns) return null
    return dateCheckIns[userId] === true
  }

  const calculateStreak = (userId) => {
    let streak = 0
    const todayDate = new Date()
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayDate)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      const dateCheckIns = item.checkIns[dateStr]
      
      if (dateCheckIns && dateCheckIns[userId] === true) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  return (
    <div className="accountability-item">
      <div className="item-header">
        <div className="item-owner-info">
          <UserAvatar userId={item.userId} name={itemOwner?.name || 'Unknown'} />
          <span className="item-owner-name">{itemOwner?.name || 'Unknown'}</span>
        </div>
        {isOwner && (
          <button className="delete-item-button" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>

      <div className="item-content">
        {isEditing && isOwner ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => {
              if (editText.trim() && editText !== item.text) {
                updateItem(roomId, item.id, editText.trim())
              } else {
                setEditText(item.text)
              }
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editText.trim() && editText !== item.text) {
                  updateItem(roomId, item.id, editText.trim())
                } else {
                  setEditText(item.text)
                }
                setIsEditing(false)
              }
              if (e.key === 'Escape') {
                setEditText(item.text)
                setIsEditing(false)
              }
            }}
            className="item-edit-input"
            autoFocus
          />
        ) : (
          <p
            className="item-text"
            onDoubleClick={() => isOwner && setIsEditing(true)}
          >
            {item.text}
          </p>
        )}
      </div>

      <div className="item-checkins">
        {members.map((member) => {
          const isChecked = getCheckInStatus(member.id)
          const streak = calculateStreak(member.id)
          const isCurrentUser = currentUser && member.id === currentUser.id

          return (
            <div key={member.id} className="checkin-row">
              <div className="checkin-member">
                <UserAvatar userId={member.id} name={member.name} size="small" />
                <span className="checkin-name">{member.name}</span>
                {streak > 0 && (
                  <span className="streak-badge">🔥 {streak}</span>
                )}
              </div>
              <div className="checkin-controls">
                {selectedDate === today && isCurrentUser ? (
                  <button
                    className={`checkin-button ${isChecked ? 'checked' : ''}`}
                    onClick={() => handleCheckIn(member.id, !isChecked)}
                  >
                    {isChecked ? '✓ Done' : 'Mark Done'}
                  </button>
                ) : (
                  <div className={`checkin-status ${isChecked ? 'completed' : 'incomplete'}`}>
                    {isChecked ? '✓' : '○'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AccountabilityItem

