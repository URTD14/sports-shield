import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useShieldStore from '../store/useShieldStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

let socketInstance = null

export function useSocket() {
  const {
    addLiveViolation,
    setSystemStatus,
    setSocketConnected,
    setUploadState,
  } = useShieldStore()

  useEffect(() => {
    if (socketInstance) return

    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socketInstance.on('connect', () => {
      setSocketConnected(true)
      console.log('[Socket] Connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', () => {
      setSocketConnected(false)
      console.log('[Socket] Disconnected')
    })

    socketInstance.on('violation_detected', (data) => {
      addLiveViolation(data)
    })

    socketInstance.on('crawler_status', (data) => {
      setSystemStatus({
        crawlerStatus: data.status || 'ACTIVE',
        lastScan: data.last_scan,
        violationsToday: data.violations_today,
        platformsMonitored: data.platforms_monitored,
      })
    })

    socketInstance.on('asset_secured', (data) => {
      setUploadState({ status: 'secured', assetId: data.asset_id })
      console.log('[Socket] Asset secured:', data.asset_id)
    })

    return () => {
      // Keep socket alive — don't disconnect on component unmount
    }
  }, [])

  return socketInstance
}

export function getSocket() {
  return socketInstance
}
