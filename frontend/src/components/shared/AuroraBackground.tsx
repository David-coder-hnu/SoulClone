import { useEffect, useRef } from 'react'

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const blobs = [
      { x: w * 0.2, y: h * 0.3, r: 300, color: 'rgba(0, 240, 255, 0.08)', vx: 0.3, vy: 0.2 },
      { x: w * 0.7, y: h * 0.5, r: 350, color: 'rgba(255, 0, 110, 0.06)', vx: -0.2, vy: 0.3 },
      { x: w * 0.5, y: h * 0.7, r: 280, color: 'rgba(255, 190, 11, 0.05)', vx: 0.15, vy: -0.25 },
      { x: w * 0.8, y: h * 0.2, r: 250, color: 'rgba(168, 85, 247, 0.04)', vx: -0.3, vy: -0.15 },
    ]

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, w, h)

      blobs.forEach((blob) => {
        blob.x += blob.vx
        blob.y += blob.vy

        if (blob.x < -blob.r || blob.x > w + blob.r) blob.vx *= -1
        if (blob.y < -blob.r || blob.y > h + blob.r) blob.vy *= -1

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r)
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
