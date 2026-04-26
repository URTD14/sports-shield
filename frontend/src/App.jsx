import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import Navbar from './components/layout/Navbar'
import StatusBar from './components/layout/StatusBar'
import ThreatTicker from './components/layout/ThreatTicker'
import CustomCursor from './components/ui/CustomCursor'
import BootScreen from './components/ui/BootScreen'
import { useSocket } from './hooks/useSocket'

import Landing from './pages/Landing'
import Vault from './pages/Vault'
import Monitor from './pages/Monitor'
import AssetDetail from './pages/AssetDetail'
import ViolationDetail from './pages/ViolationDetail'
import Intelligence from './pages/Intelligence'
import Demo from './pages/Demo'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ClerkCallback from './pages/ClerkCallback'

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'inset(0 0 4% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(4% 0 0 0)' }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  useSocket()

  const [booted, setBooted] = useState(() => {
    return sessionStorage.getItem('ss_booted') === '1'
  })

  const handleBootComplete = () => {
    sessionStorage.setItem('ss_booted', '1')
    setBooted(true)
  }

  return (
    <>
      {/* Boot screen — once per session */}
      {!booted && <BootScreen onComplete={handleBootComplete} />}

      {/* Global overlays */}
      <div id="grain-overlay" />
      <CustomCursor />

      {/* Layout */}
      <Navbar />
      <ThreatTicker />
      <StatusBar />

      {/* Pages */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
          <Route path="/vault" element={<AnimatedPage><Vault /></AnimatedPage>} />
          <Route path="/monitor" element={<AnimatedPage><Monitor /></AnimatedPage>} />
          <Route path="/asset/:id" element={<AnimatedPage><AssetDetail /></AnimatedPage>} />
          <Route path="/violation/:id" element={<AnimatedPage><ViolationDetail /></AnimatedPage>} />
          <Route path="/intelligence" element={<AnimatedPage><Intelligence /></AnimatedPage>} />
          <Route path="/demo" element={<AnimatedPage><Demo /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/signup" element={<AnimatedPage><Signup /></AnimatedPage>} />
          <Route path="/login/sso-callback" element={<AnimatedPage><ClerkCallback /></AnimatedPage>} />
          <Route path="/signup/sso-callback" element={<AnimatedPage><ClerkCallback /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
