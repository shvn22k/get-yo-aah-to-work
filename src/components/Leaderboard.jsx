import { useApp } from '../context/AppContext'
import UserAvatar from './UserAvatar'
import './Leaderboard.css'

function Leaderboard({ room, selectedDate }) {
  const { currentUser } = useApp()

  const calculateUserScore = (userId) => {
    let score = 0
    const userItems = (room.items && Array.isArray(room.items)) ? room.items.filter(item => item && item.userId === userId) : []
    
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    userItems.forEach(item => {
      if (!item) return
      
      const now = new Date()
      const completedDates = item.completedDates || {}
      const checkIns = item.checkIns || {}
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(now)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = formatDate(checkDate)
        
        let wasCompleted = false
        
        if (completedDates && typeof completedDates === 'object' && completedDates !== null) {
          const dateCompletions = completedDates[dateStr]
          if (dateCompletions && typeof dateCompletions === 'object' && dateCompletions[userId] === true) {
            wasCompleted = true
          }
        }
        
        if (!wasCompleted && checkIns && typeof checkIns === 'object' && checkIns !== null) {
          const dateCheckIns = checkIns[dateStr]
          if (dateCheckIns && typeof dateCheckIns === 'object' && dateCheckIns[userId] === true) {
            wasCompleted = true
          }
        }
        
        if (wasCompleted) {
          score += 10
        }
      }
    })
    
    let streak = 0
    userItems.forEach(item => {
      if (!item) return
      
      let itemStreak = 0
      const now = new Date()
      const completedDates = item.completedDates || {}
      const checkIns = item.checkIns || {}
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(now)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = formatDate(checkDate)
        
        let wasCompleted = false
        
        if (completedDates && typeof completedDates === 'object' && completedDates !== null) {
          const dateCompletions = completedDates[dateStr]
          if (dateCompletions && typeof dateCompletions === 'object' && dateCompletions[userId] === true) {
            wasCompleted = true
          }
        }
        
        if (!wasCompleted && checkIns && typeof checkIns === 'object' && checkIns !== null) {
          const dateCheckIns = checkIns[dateStr]
          if (dateCheckIns && typeof dateCheckIns === 'object' && dateCheckIns[userId] === true) {
            wasCompleted = true
          }
        }
        
        if (wasCompleted) {
          itemStreak++
        } else {
          break
        }
      }
      
      streak = Math.max(streak, itemStreak)
    })
    
    score += streak * 5
    
    return score
  }

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}.`
  }

  const membersWithScores = room.members
    .map(member => ({
      ...member,
      score: calculateUserScore(member.id)
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Leaderboard</h3>
      <div className="leaderboard-list">
        {membersWithScores.map((member, index) => {
          const isCurrentUser = currentUser && member.id === currentUser.id
          return (
            <div
              key={member.id}
              className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-three' : ''}`}
            >
              <div className="leaderboard-rank">{getRankEmoji(index)}</div>
              <UserAvatar userId={member.id} name={member.name} size="small" />
              <div className="leaderboard-info">
                <div className="leaderboard-name">{member.name}</div>
                <div className="leaderboard-score">{member.score} pts</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Leaderboard

