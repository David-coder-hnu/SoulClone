import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    const onMouseMove = (e: MouseEvent) => {
      glow.style.left = `${e.clientX}px`
      glow.style.top = `${e.clientY}px`
    }

    const onMouseEnter = () => {
      glow.style.opacity = '1'
    }

    const onMouseLeave = () => {
      glow.style.opacity = '0'
    }

    window.addEventListener('mousemove', onMouseMove)
    document.body.addEventListener('mouseenter', onMouseEnter)
    document.body.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.body.removeEventListener('mouseenter', onMouseEnter)
      document.body.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="fixed w-[300px] h-[300px] rounded-full pointer-events-none z-[9999] opacity-0 transition-opacity duration-300 hidden md:block"
      style={{
        background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
      }}
    />
  )
}
