import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useApp } from '../context/AppContext'
import UserAvatar from '../components/UserAvatar'
import './Dashboard.css'

function Dashboard() {
  const { rooms, currentUser } = useApp()

  const calculateTotalPoints = () => {
    let total = 0
    rooms.forEach(room => {
      const userItems = room.items.filter(item => item.userId === currentUser?.id)
      userItems.forEach(item => {
        const todayDate = new Date()
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(todayDate)
          checkDate.setDate(checkDate.getDate() - i)
          const dateStr = checkDate.toISOString().split('T')[0]
          const dateCheckIns = item.checkIns[dateStr]
          
          if (dateCheckIns && dateCheckIns[currentUser.id] === true) {
            total += 10
          }
        }
      })
    })
    return total
  }

  const calculateTotalStreak = () => {
    let maxStreak = 0
    rooms.forEach(room => {
      const userItems = room.items.filter(item => item.userId === currentUser?.id)
      userItems.forEach(item => {
        let streak = 0
        const todayDate = new Date()
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(todayDate)
          checkDate.setDate(checkDate.getDate() - i)
          const dateStr = checkDate.toISOString().split('T')[0]
          const dateCheckIns = item.checkIns[dateStr]
          
          if (dateCheckIns && dateCheckIns[currentUser.id] === true) {
            streak++
          } else {
            break
          }
        }
        
        maxStreak = Math.max(maxStreak, streak)
      })
    })
    return maxStreak
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <Link to="/" className="back-link">
          ← Back
        </Link>
        <h1 className="dashboard-title">Your Dashboard</h1>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-profile">
          <UserAvatar userId={currentUser?.id} name={currentUser?.name || 'You'} size="large" />
          <div className="profile-name">{currentUser?.name || 'You'}</div>
          <div className="user-button-wrapper">
            <UserButton />
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{calculateTotalPoints()}</div>
            <div className="stat-label">Total Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🔥 {calculateTotalStreak()}</div>
            <div className="stat-label">Best Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{rooms.length}</div>
            <div className="stat-label">Rooms</div>
          </div>
        </div>

        <div className="dashboard-rooms">
          <h2 className="section-title">Your Rooms</h2>
          {rooms.length === 0 ? (
            <p className="empty-state">
              You haven't joined any rooms yet. Create or join a room to get started!
            </p>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <Link key={room.id} to={`/room/${room.id}`} className="room-card-link">
                  <div className="room-card">
                    <h3 className="room-card-name">{room.name}</h3>
                    <div className="room-card-meta">
                      <span>{room.members.length} member{room.members.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{room.items.length} item{room.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="room-card-code">Code: {room.id}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

