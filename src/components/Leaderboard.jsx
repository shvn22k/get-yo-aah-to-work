import { useApp } from '../context/AppContext'
import UserAvatar from './UserAvatar'
import './Leaderboard.css'

function Leaderboard({ room, selectedDate }) {
  const { currentUser } = useApp()

  const calculateUserScore = (userId) => {
    let score = 0
    const userItems = room.items.filter(item => item.userId === userId)
    
    userItems.forEach(item => {
      const todayDate = new Date()
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        const dateCheckIns = item.checkIns[dateStr]
        
        if (dateCheckIns && dateCheckIns[userId] === true) {
          score += 10
        }
      }
    })
    
    let streak = 0
    userItems.forEach(item => {
      let itemStreak = 0
      const todayDate = new Date()
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        const dateCheckIns = item.checkIns[dateStr]
        
        if (dateCheckIns && dateCheckIns[userId] === true) {
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

