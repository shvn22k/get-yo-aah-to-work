import { useApp } from '../context/AppContext'
import UserAvatar from './UserAvatar'
import './ProgressTracker.css'

function ProgressTracker({ room, selectedDate }) {
  const { currentUser } = useApp()

  const calculateUserProgress = (userId) => {
    const userItems = (room.items && Array.isArray(room.items)) ? room.items.filter(item => item && item.userId === userId) : []
    if (userItems.length === 0) return { completed: 0, total: 0, percentage: 0 }

    let completed = 0
    userItems.forEach(item => {
      if (!item) return
      
      const completedDates = item.completedDates || {}
      const dateCompletions = completedDates[selectedDate]
      if (dateCompletions && typeof dateCompletions === 'object' && dateCompletions[userId] === true) {
        completed++
      } else if (item.checkIns && typeof item.checkIns === 'object') {
        const dateCheckIns = item.checkIns[selectedDate]
        if (dateCheckIns && typeof dateCheckIns === 'object' && dateCheckIns[userId] === true) {
          completed++
        }
      }
    })

    return {
      completed,
      total: userItems.length,
      percentage: userItems.length > 0 ? Math.round((completed / userItems.length) * 100) : 0
    }
  }

  const calculateStreak = (userId) => {
    let maxStreak = 0
    const userItems = (room.items && Array.isArray(room.items)) ? room.items.filter(item => item && item.userId === userId) : []
    
    userItems.forEach(item => {
      if (!item) return
      
      let streak = 0
      const todayDate = new Date()
      const completedDates = item.completedDates || {}
      const checkIns = item.checkIns || {}
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        const dateCompletions = completedDates[dateStr]
        const isCompleted = dateCompletions && typeof dateCompletions === 'object' && dateCompletions[userId] === true
        
        if (!isCompleted && checkIns && typeof checkIns === 'object') {
          const dateCheckIns = checkIns[dateStr]
          if (dateCheckIns && typeof dateCheckIns === 'object' && dateCheckIns[userId] === true) {
            streak++
          } else {
            break
          }
        } else if (isCompleted) {
          streak++
        } else {
          break
        }
      }
      
      maxStreak = Math.max(maxStreak, streak)
    })
    
    return maxStreak
  }

  const calculatePoints = (userId) => {
    let points = 0
    const userItems = (room.items && Array.isArray(room.items)) ? room.items.filter(item => item && item.userId === userId) : []
    
    userItems.forEach(item => {
      if (!item) return
      
      const todayDate = new Date()
      const completedDates = item.completedDates || {}
      const checkIns = item.checkIns || {}
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        const dateCompletions = completedDates[dateStr]
        const isCompleted = dateCompletions && typeof dateCompletions === 'object' && dateCompletions[userId] === true
        
        if (!isCompleted && checkIns && typeof checkIns === 'object') {
          const dateCheckIns = checkIns[dateStr]
          if (dateCheckIns && typeof dateCheckIns === 'object' && dateCheckIns[userId] === true) {
            points += 10
          }
        } else if (isCompleted) {
          points += 10
        }
      }
    })
    
    return points
  }

  return (
    <div className="progress-tracker">
      <h3 className="tracker-title">Progress</h3>
      <div className="progress-list">
        {room.members.map((member) => {
          const progress = calculateUserProgress(member.id)
          const streak = calculateStreak(member.id)
          const points = calculatePoints(member.id)
          const isCurrentUser = currentUser && member.id === currentUser.id

          return (
            <div key={member.id} className={`progress-item ${isCurrentUser ? 'current-user' : ''}`}>
              <div className="progress-header">
                <UserAvatar userId={member.id} name={member.name} size="small" />
                <div className="progress-info">
                  <div className="progress-name">{member.name}</div>
                  <div className="progress-stats">
                    {streak > 0 && <span className="stat-badge">🔥 {streak} day streak</span>}
                    <span className="stat-badge">⭐ {points} points</span>
                  </div>
                </div>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="progress-text">
                {progress.completed} / {progress.total} completed
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressTracker

