import { SignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Signup() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '80px 20px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,65,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,65,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,255,65,0.06), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 400,
          background: 'rgba(10, 16, 32, 0.85)',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--accent-signal), transparent)',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 32 }}>
          <div className="font-data" style={{ 
            color: 'var(--accent-signal)', 
            letterSpacing: '0.25em', 
            marginBottom: 8,
            fontSize: '0.75rem',
          }}>
            NEW AGENT
          </div>
          <h1 className="font-orbitron" style={{ 
            fontSize: 24, 
            fontWeight: 900, 
            color: 'var(--text-primary)',
            letterSpacing: '0.08em',
          }}>
            REQUEST ACCESS
          </h1>
        </div>

        <SignUp 
          routing="path"
          path="/signup"
          signInUrl="/login"
          redirectUrl="/vault"
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
              },
              card: {
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
              },
              headerTitle: {
                display: 'none',
              },
              headerSubtitle: {
                display: 'none',
              },
              socialButtonsBlockButton: {
                background: '#4285f4',
                color: 'white',
                border: 'none',
              },
              formButtonPrimary: {
                background: 'var(--accent-signal)',
                border: 'none',
              },
              formFieldInput: {
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              },
              formFieldLabel: {
                color: 'var(--text-secondary)',
              },
              dividerLine: {
                background: 'var(--border-subtle)',
              },
              dividerText: {
                color: 'var(--text-secondary)',
              },
              footerActionLink: {
                color: 'var(--accent-data)',
              },
            },
          }}
        />

        <div style={{ 
          padding: '0 32px 32px',
          textAlign: 'center',
        }}>
          <p className="font-data" style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
            ALREADY REGISTERED?
          </p>
          <Link
            to="/login"
            style={{ 
              fontSize: 10, 
              color: 'var(--accent-data)', 
              letterSpacing: '0.12em',
              textDecoration: 'none',
            }}
          >
            AUTHENTICATE →
          </Link>
        </div>
      </motion.div>

      <Link
        to="/"
        style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.15em',
          textDecoration: 'none',
        }}
      >
        ← RETURN TO SURFACE
      </Link>
    </div>
  )
}