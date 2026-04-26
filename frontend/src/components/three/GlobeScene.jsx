import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, Stars, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function latLngToVec3(lat, lng, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

const CITIES = [
  { name: 'London',      lat: 51.5,  lng: -0.1,   violations: 15 },
  { name: 'Madrid',      lat: 40.4,  lng: -3.7,   violations: 8  },
  { name: 'New York',    lat: 40.7,  lng: -74.0,  violations: 18 },
  { name: 'São Paulo',   lat: -23.5, lng: -46.6,  violations: 6  },
  { name: 'Jakarta',     lat: -6.2,  lng: 106.8,  violations: 11 },
  { name: 'Tokyo',       lat: 35.7,  lng: 139.7,  violations: 5  },
  { name: 'Sydney',      lat: -33.9, lng: 151.2,  violations: 4  },
  { name: 'Munich',      lat: 48.1,  lng: 11.6,   violations: 7  },
  { name: 'Dubai',       lat: 25.2,  lng: 55.3,   violations: 9  },
  { name: 'Mumbai',      lat: 19.1,  lng: 72.9,   violations: 7  },
  { name: 'Moscow',      lat: 55.7,  lng: 37.6,   violations: 6  },
  { name: 'Buenos Aires',lat: -34.6, lng: -58.4,  violations: 5  },
  { name: 'Lagos',       lat: 6.5,   lng: 3.4,    violations: 4  },
  { name: 'Seoul',       lat: 37.6,  lng: 126.9,  violations: 8  },
  { name: 'Paris',       lat: 48.9,  lng: 2.3,    violations: 10 },
  { name: 'Chicago',     lat: 41.9,  lng: -87.6,  violations: 12 },
  { name: 'Cairo',       lat: 30.0,  lng: 31.2,   violations: 3  },
  { name: 'Bangkok',     lat: 13.7,  lng: 100.5,  violations: 6  },
  { name: 'Toronto',     lat: 43.7,  lng: -79.4,  violations: 9  },
  { name: 'Amsterdam',   lat: 52.4,  lng: 4.9,    violations: 11 },
]

const ARCS = [
  { from: 0, to: 2,  color: '#ff1744', delay: 0.0 },
  { from: 1, to: 4,  color: '#ff1744', delay: 0.4 },
  { from: 7, to: 3,  color: '#ffab00', delay: 0.8 },
  { from: 2, to: 5,  color: '#00b8d4', delay: 1.2 },
  { from: 0, to: 6,  color: '#ff1744', delay: 1.6 },
  { from: 14,to: 2,  color: '#ff1744', delay: 0.3 },
  { from: 8, to: 4,  color: '#ffab00', delay: 0.9 },
  { from: 5, to: 15, color: '#00b8d4', delay: 1.4 },
  { from: 9, to: 6,  color: '#ffab00', delay: 0.6 },
  { from: 10,to: 0,  color: '#ff1744', delay: 2.0 },
  { from: 13,to: 5,  color: '#00b8d4', delay: 1.7 },
  { from: 3, to: 12, color: '#ff1744', delay: 2.3 },
  { from: 16,to: 2,  color: '#ffab00', delay: 0.2 },
  { from: 19,to: 7,  color: '#00b8d4', delay: 1.1 },
  { from: 18,to: 1,  color: '#ff1744', delay: 2.6 },
]

function CityDot({ city }) {
  const pos = latLngToVec3(city.lat, city.lng, 1.01)
  const dotRef = useRef()
  const ringRef = useRef()
  const offset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    const t = state.clock.elapsedTime + offset.current
    if (dotRef.current) {
      dotRef.current.scale.setScalar(0.85 + Math.sin(t * 2.5) * 0.15)
    }
    if (ringRef.current) {
      const s = 1 + (Math.sin(t * 1.5) * 0.5 + 0.5) * 1.8
      ringRef.current.scale.setScalar(s)
      ringRef.current.material.opacity = 0.5 - (s - 1) / 3.6 * 0.5
    }
  })

  const isHot = city.violations > 8
  const color = isHot ? '#ff1744' : '#00ff41'
  const ringColor = isHot ? '#ff1744' : '#00b8d4'

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.016, 0.02, 16]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Core dot */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function ViolationArc({ from, to, color = '#ff1744', delay = 0 }) {
  const progress = useRef(delay % 1)
  const cycleRef = useRef(Math.floor(delay))
  const [points, setPoints] = useState([])

  const fromVec = latLngToVec3(CITIES[from].lat, CITIES[from].lng, 1.02)
  const toVec   = latLngToVec3(CITIES[to].lat,   CITIES[to].lng,   1.02)
  const mid     = new THREE.Vector3()
    .addVectors(fromVec, toVec)
    .normalize()
    .multiplyScalar(1.45 + Math.random() * 0.15)
  const curve   = new THREE.QuadraticBezierCurve3(fromVec, mid, toVec)

  useFrame((state, delta) => {
    progress.current += delta * 0.35
    if (progress.current > 1) {
      progress.current = 0
      cycleRef.current++
    }
    const t = progress.current
    if (t < 0.04) { setPoints([]); return }
    const pts = curve.getPoints(Math.floor(t * 40))
    setPoints(pts.map(p => [p.x, p.y, p.z]))
  })

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.2}
      transparent
      opacity={0.65}
    />
  )
}

function OrbitalRing() {
  const groupRef  = useRef()
  const satRef    = useRef()
  const angleRef  = useRef(0)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.18
    angleRef.current += delta * 0.6
    if (satRef.current) {
      satRef.current.position.set(
        Math.cos(angleRef.current) * 1.38,
        0,
        Math.sin(angleRef.current) * 1.38
      )
    }
  })

  return (
    <group ref={groupRef} rotation={[1.1, 0.3, 0]}>
      {/* Ring */}
      <mesh>
        <torusGeometry args={[1.38, 0.0015, 2, 180]} />
        <meshBasicMaterial color="#00b8d4" transparent opacity={0.35} />
      </mesh>
      {/* Satellite */}
      <mesh ref={satRef}>
        <boxGeometry args={[0.018, 0.006, 0.03]} />
        <meshBasicMaterial color="#00ff41" />
      </mesh>
    </group>
  )
}

function Globe() {
  const groupRef = useRef()
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0.4, 4.8)
  }, [])

  useFrame((state, delta) => {
    // Cinematic camera dolly-in
    if (camera.position.z > 2.8) {
      camera.position.z -= delta * 1.1
      camera.position.y -= delta * 0.15
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005
    }
  })

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <Sphere args={[1, 64, 64]}>
        <meshPhongMaterial
          color="#020b1a"
          emissive="#001433"
          emissiveIntensity={0.5}
          shininess={12}
          specular="#00b8d4"
        />
      </Sphere>

      {/* Latitude/longitude wire */}
      <Sphere args={[1.002, 28, 28]}>
        <meshBasicMaterial color="#00b8d4" wireframe transparent opacity={0.045} />
      </Sphere>

      {/* Inner glow */}
      <Sphere args={[1.04, 32, 32]}>
        <meshBasicMaterial color="#002244" transparent opacity={0.18} side={THREE.BackSide} />
      </Sphere>

      {/* Outer atmosphere */}
      <Sphere args={[1.10, 32, 32]}>
        <meshBasicMaterial color="#001833" transparent opacity={0.10} side={THREE.BackSide} />
      </Sphere>

      {/* Farthest haze */}
      <Sphere args={[1.18, 32, 32]}>
        <meshBasicMaterial color="#000d22" transparent opacity={0.05} side={THREE.BackSide} />
      </Sphere>

      {/* Cities */}
      {CITIES.map((city) => (
        <CityDot key={city.name} city={city} />
      ))}

      {/* Arcs */}
      {ARCS.map((arc, i) => (
        <ViolationArc
          key={i}
          from={arc.from}
          to={arc.to}
          color={arc.color}
          delay={arc.delay}
        />
      ))}

      {/* Orbital ring */}
      <OrbitalRing />
    </group>
  )
}

export default function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.8], fov: 42 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 3, 4]}   intensity={1.0}  color="#00b8d4" />
      <pointLight position={[-4, -2, -4]} intensity={0.4}  color="#001a3e" />
      <pointLight position={[0, 4, 0]}   intensity={0.25} color="#00ff41" />

      <Stars
        radius={120}
        depth={60}
        count={7000}
        factor={2.8}
        saturation={0}
        fade
        speed={0.3}
      />

      <Suspense fallback={null}>
        <Globe />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.4}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
    </Canvas>
  )
}
