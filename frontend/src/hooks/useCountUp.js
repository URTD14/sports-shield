import { useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

export function useCountUp(target, duration = 2000, decimals = 0) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    startRef.current = performance.now()

    const animate = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target
      setDisplay(parseFloat(current.toFixed(decimals)))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, decimals])

  return display
}

export function useCountUpInView(target, duration = 2000, decimals = 0) {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const value = useCountUp(started ? target : 0, duration, decimals)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, value }
}
