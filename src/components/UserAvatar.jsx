import './UserAvatar.css'

function UserAvatar({ userId, name, size = 'medium' }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarNumber = parseInt(userId) % 5 || 1

  return (
    <div className={`user-avatar ${size}`}>
      {getInitials(name)}
    </div>
  )
}

export default UserAvatar

