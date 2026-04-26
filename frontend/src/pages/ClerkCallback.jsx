import { useEffect } from 'react'
import { useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export default function ClerkCallback() {
  const { handleRedirectCallback } = useClerk()
  const navigate = useNavigate()

  useEffect(() => {
    handleRedirectCallback().then(() => {
      navigate('/vault')
    })
  }, [handleRedirectCallback, navigate])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'var(--text-primary)'
    }}>
      <div>Completing authentication...</div>
    </div>
  )
}