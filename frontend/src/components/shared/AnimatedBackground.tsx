import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  phase: number
}

const COLORS = ['#00f0ff', '#ff006e', '#ffbe0b', '#a855f7']
const CONNECTION_DISTANCE = 120
const MAX_CONNECTIONS = 3
const MOUSE_RADIUS = 200
const MOUSE_FORCE = 0.8

export default function AnimatedBackground({ opacity = 1 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const PARTICLE_COUNT = Math.min(150, Math.floor((w * h) / 12000))

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }))

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const mouseActive = mouseRef.current.active

      // Update and draw particles
      particles.forEach((p) => {
        // Ambient drift with sine wave
        p.phase += 0.008
        p.x += p.vx + Math.sin(p.phase) * 0.08
        p.y += p.vy + Math.cos(p.phase * 0.7) * 0.08

        // Wrap around edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        // Mouse repulsion
        if (mouseActive) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_FORCE
            p.x += (dx / dist) * force * 3
            p.y += (dy / dist) * force * 3
          }
        }

        // Draw particle with glow
        const flicker = 0.5 + Math.sin(p.phase * 2) * 0.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * flicker
        ctx.fill()

        // Glow ring
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        gradient.addColorStop(0, p.color + '33')
        gradient.addColorStop(1, p.color + '00')
        ctx.fillStyle = gradient
        ctx.fill()
      })

      // Draw connections
      ctx.globalAlpha = 0.12
      for (let i = 0; i < particles.length; i++) {
        let connections = 0
        for (let j = i + 1; j < particles.length; j++) {
          if (connections >= MAX_CONNECTIONS) break
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = particles[i].color
            ctx.globalAlpha = alpha
            ctx.lineWidth = 0.5
            ctx.stroke()
            connections++
          }
        }
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity }}
    />
  )
}
