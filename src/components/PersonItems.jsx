import { useState } from 'react'
import { useApp } from '../context/AppContext'
import UserAvatar from './UserAvatar'
import './PersonItems.css'

function PersonItems({ member, roomId, selectedDate, today }) {
  const { rooms, addItem, checkIn, deleteItem, updateItem, currentUser } = useApp()
  const [newItemText, setNewItemText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editText, setEditText] = useState('')

  const room = rooms.find(r => r.id.toLowerCase() === roomId.toLowerCase())
  if (!room) return null

  const getPreviousDate = (dateStr) => {
    const date = new Date(dateStr)
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }

  const isItemVisibleOnDate = (item, viewDate) => {
    const itemFirstDate = item.firstDate || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
    const firstDateStr = itemFirstDate.split('T')[0]
    
    if (firstDateStr > viewDate) return false
    
    if (firstDateStr === viewDate) return true
    
    const prevDate = getPreviousDate(viewDate)
    const completedDates = item.completedDates || (item.checkIns ? {} : {})
    
    if (item.checkIns && !item.completedDates) {
      Object.keys(item.checkIns).forEach(date => {
        const checkInData = item.checkIns[date]
        if (checkInData && typeof checkInData === 'object' && checkInData[member.id] === true) {
          if (!completedDates[date]) completedDates[date] = {}
          completedDates[date][member.id] = true
        }
      })
    }
    
    const prevDateCompletions = completedDates[prevDate] || {}
    const wasCompletedPrevDay = prevDateCompletions[member.id] === true
    
    return !wasCompletedPrevDay
  }

  const allUserItems = (room.items && Array.isArray(room.items)) 
    ? room.items.filter(item => item.userId === member.id)
    : []
  
  const userItems = allUserItems.filter(item => isItemVisibleOnDate(item, selectedDate))
  const isCurrentUser = currentUser && member.id === currentUser.id

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (newItemText.trim() && currentUser && isCurrentUser) {
      const today = new Date().toISOString().split('T')[0]
      await addItem(roomId, newItemText.trim(), member.id, today)
      setNewItemText('')
      setShowAddForm(false)
    }
  }

  const handleCheckIn = async (itemId, completed) => {
    if (isCurrentUser) {
      await checkIn(roomId, itemId, member.id, selectedDate, completed)
    }
  }

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?') && isCurrentUser) {
      await deleteItem(roomId, itemId)
    }
  }

  const handleEdit = (item) => {
    if (isCurrentUser) {
      setEditingItemId(item.id)
      setEditText(item.text)
    }
  }

  const handleSaveEdit = async (itemId) => {
    if (editText.trim() && isCurrentUser) {
      await updateItem(roomId, itemId, editText.trim())
      setEditingItemId(null)
      setEditText('')
    }
  }

  const getCheckInStatus = (item) => {
    if (item.completedDates?.[selectedDate]) {
      const dateCompletions = item.completedDates[selectedDate]
      if (dateCompletions && typeof dateCompletions === 'object') {
        return dateCompletions[member.id] === true
      }
    }
    
    if (item.checkIns?.[selectedDate]) {
      const checkInData = item.checkIns[selectedDate]
      if (checkInData && typeof checkInData === 'object') {
        return checkInData[member.id] === true
      }
    }
    
    return false
  }

  const calculateStreak = (item) => {
    let streak = 0
    const todayDate = new Date()
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayDate)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      const dateCompletions = item.completedDates?.[dateStr]
      
      if (dateCompletions && typeof dateCompletions === 'object' && dateCompletions[member.id] === true) {
        streak++
      } else {
        const checkInData = item.checkIns?.[dateStr]
        if (checkInData && typeof checkInData === 'object' && checkInData[member.id] === true) {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  }

  return (
    <div className="person-items">
      <div className="person-header">
        <UserAvatar userId={member.id} name={member.name} size="medium" />
        <div className="person-info">
          <h3 className="person-name">{member.name}</h3>
          <div className="person-stats">
            <span className="item-count">{userItems.length} item{userItems.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {isCurrentUser && !showAddForm && selectedDate === today && (
        <button
          className="add-item-button-small"
          onClick={() => setShowAddForm(true)}
        >
          + Add Item
        </button>
      )}

      {isCurrentUser && showAddForm && selectedDate === today && (
        <form className="add-item-form-small" onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Add a new to-do..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="add-item-input-small"
            autoFocus
          />
          <div className="add-item-actions-small">
            <button type="submit" className="add-item-submit-small">
              Add
            </button>
            <button
              type="button"
              className="add-item-cancel-small"
              onClick={() => {
                setShowAddForm(false)
                setNewItemText('')
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list-person">
        {userItems.length === 0 ? (
          <p className="empty-state-person">
            {isCurrentUser ? 'No items yet. Add one to get started!' : 'No items yet.'}
          </p>
        ) : (
          userItems.map((item) => {
            const isChecked = getCheckInStatus(item)
            const streak = calculateStreak(item)
            const isEditing = editingItemId === item.id

            return (
              <div key={item.id} className="item-card-person">
                <div className="item-card-header">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => {
                        if (editText.trim() && editText !== item.text) {
                          handleSaveEdit(item.id)
                        } else {
                          setEditingItemId(null)
                          setEditText('')
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editText.trim() && editText !== item.text) {
                            handleSaveEdit(item.id)
                          } else {
                            setEditingItemId(null)
                            setEditText('')
                          }
                        }
                        if (e.key === 'Escape') {
                          setEditingItemId(null)
                          setEditText('')
                        }
                      }}
                      className="item-edit-input-small"
                      autoFocus
                    />
                  ) : (
                    <p
                      className="item-text-person"
                      onDoubleClick={() => isCurrentUser && handleEdit(item)}
                    >
                      {item.text}
                    </p>
                  )}
                  {isCurrentUser && !isEditing && (
                    <div className="item-actions">
                      <button
                        className="delete-item-button-small"
                        onClick={() => handleDelete(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="item-checkin-person">
                  {selectedDate <= today && isCurrentUser ? (
                    <button
                      className={`checkin-button-person ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleCheckIn(item.id, !isChecked)}
                    >
                      {isChecked ? '✓ Done' : 'Mark Done'}
                    </button>
                  ) : (
                    <div className={`checkin-status-person ${isChecked ? 'completed' : 'incomplete'}`}>
                      {isChecked ? '✓ Completed' : '○ Not done'}
                    </div>
                  )}
                  {streak > 0 && (
                    <span className="streak-badge-person">🔥 {streak} day streak</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PersonItems

