import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { useApp } from '../context/AppContext'
import './Landing.css'

function Landing() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()
  const { createRoom, joinRoom, rooms, refreshRooms } = useApp()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (roomName.trim()) {
      const roomId = await createRoom(roomName.trim())
      if (roomId) {
        navigate(`/room/${roomId}`)
      }
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (roomCode.trim()) {
      const trimmedCode = roomCode.trim()
      const result = await joinRoom(trimmedCode)
      if (result === true) {
        navigate(`/room/${trimmedCode}`)
      } else if (result && result.error) {
        alert(result.error)
      } else {
        alert('Room not found. Please check the room code. Make sure the room was created and you\'re using the correct code.')
      }
    }
  }

  return (
    <div className="landing">
      <nav className="floating-navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">Get Yo Aah To Work</Link>
          <div className="navbar-actions">
            <SignedIn>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <div className="user-button-wrapper">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="navbar-button">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="navbar-button primary">Sign Up</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="landing-content">
          <h1 className="landing-title">Get Yo Aah To Work</h1>
        <p className="landing-subtitle">
          Create accountability rooms with friends and stay on track together
        </p>
        <p className="landing-note">
          Rooms are limited to 4 members for a focused, intimate accountability experience
        </p>

          <SignedIn>
            <div className="landing-actions">
              <button
                className="action-button primary"
                onClick={() => {
                  setShowCreate(true)
                  setShowJoin(false)
                }}
              >
                Create Room
              </button>
              <button
                className="action-button secondary"
                onClick={() => {
                  setShowJoin(true)
                  setShowCreate(false)
                }}
              >
                Join Room
              </button>
            </div>
          </SignedIn>

          <SignedOut>
            <p className="auth-prompt">Please sign in to create or join rooms</p>
          </SignedOut>

        {showCreate && (
          <form className="room-form" onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="form-input"
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="form-button">
                Create
              </button>
              <button
                type="button"
                className="form-button cancel"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {showJoin && (
          <form className="room-form" onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="form-input"
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="form-button">
                Join
              </button>
              <button
                type="button"
                className="form-button cancel"
                onClick={() => setShowJoin(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        </div>
      </section>

      <section className="features-section">
        <div className="section-content">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-title">Create Rooms</h3>
              <p className="feature-text">
                Start an accountability room and invite friends to join. Each room is a private space for your group.
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Set Goals</h3>
              <p className="feature-text">
                Add daily accountability items. Track habits, goals, or commitments you want to stay consistent with.
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Check In Daily</h3>
              <p className="feature-text">
                Mark your items as complete each day. Build streaks and earn points for consistency.
              </p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Stay Motivated</h3>
              <p className="feature-text">
                See your progress, compete on the leaderboard, and celebrate streaks together with your friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="section-content">
          <h2 className="section-title">Built for Friends</h2>
          <p className="about-text">
            Accountability works best when you have people who care about your progress. This app makes it easy to create a space where friends can support each other's goals, celebrate wins, and stay consistent together.
          </p>
          <p className="about-text">
            Whether you're working on fitness, learning, productivity, or any other habit, having friends check in with you makes all the difference.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">Get Yo Aah To Work</p>
          <SignedIn>
            <Link to="/dashboard" className="footer-link">Go to Dashboard</Link>
          </SignedIn>
        </div>
      </footer>
    </div>
  )
}

export default Landing

