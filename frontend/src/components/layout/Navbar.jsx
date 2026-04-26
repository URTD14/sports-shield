import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useShieldStore from '../../store/useShieldStore'
import { useUser, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'

const NAVLINKS = [
  { to: '/', label: 'HOME', exact: true },
  { to: '/vault', label: 'VAULT' },
  { to: '/monitor', label: 'MONITOR' },
  { to: '/intelligence', label: 'INTELLIGENCE' },
  { to: '/demo', label: 'DEMO', highlight: true },
]

export default function Navbar() {
  const { socketConnected } = useShieldStore()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return null
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user'

  return (
    <motion.nav
      initial={{ y: -52 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 1000,
        background: 'rgba(5,10,18,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 32,
      }}
    >
      {/* Logo */}
      <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 1L2 5V12C2 16.97 6.08 21.65 11 23C15.92 21.65 20 16.97 20 12V5L11 1Z"
            stroke="var(--accent-signal)"
            strokeWidth="1.5"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 4px var(--accent-signal))' }}
          />
          <path
            d="M7 11L10 14L15 9"
            stroke="var(--accent-signal)"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
        <span
          className="font-orbitron font-bold"
          style={{ fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.12em' }}
        >
          SPORT<span style={{ color: 'var(--accent-signal)' }}>SHIELD</span>
        </span>
      </NavLink>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {NAVLINKS.map(({ to, label, exact, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            data-cursor="interactive"
            style={({ isActive }) => ({
              padding: '6px 14px',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              color: isActive
                ? 'var(--accent-signal)'
                : highlight
                ? 'var(--accent-data)'
                : 'var(--text-secondary)',
              background: isActive
                ? 'rgba(0,255,65,0.07)'
                : highlight
                ? 'rgba(0,184,212,0.07)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(0,255,65,0.2)'
                : highlight
                ? '1px solid rgba(0,184,212,0.3)'
                : '1px solid transparent',
              transition: 'all 0.15s',
              fontWeight: isActive || highlight ? 600 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* User menu / Login */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <SignedIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {userEmail}
            </span>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: 28,
                    height: 28,
                  }
                }
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <NavLink
            to="/login"
            data-cursor="interactive"
            className="font-data"
            style={{ fontSize: 10, letterSpacing: '0.12em', padding: '6px 12px', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            LOGIN
          </NavLink>
          <NavLink
            to="/signup"
            data-cursor="interactive"
            className="font-data"
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              padding: '6px 12px',
              background: 'rgba(0,255,65,0.1)',
              border: '1px solid rgba(0,255,65,0.3)',
              color: 'var(--accent-signal)',
              textDecoration: 'none',
            }}
          >
            SIGN UP
          </NavLink>
        </SignedOut>

        {/* Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: socketConnected ? 'var(--accent-signal)' : 'var(--text-secondary)',
              boxShadow: socketConnected ? '0 0 6px var(--accent-signal)' : 'none',
            }}
          />
          <span className="font-data" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {socketConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            border: '1px solid rgba(0,255,65,0.2)',
            background: 'rgba(0,255,65,0.05)',
          }}
        >
          <span className="font-data" style={{ fontSize: 10, color: 'var(--accent-signal)' }}>
            MONITORING ACTIVE
          </span>
        </div>
      </div>
    </motion.nav>
  )
}