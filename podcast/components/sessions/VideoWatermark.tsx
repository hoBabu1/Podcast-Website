'use client'
import { useEffect, useRef } from 'react'

export function VideoWatermark({ email }: { email: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.font = '13px monospace'
    ctx.fillStyle = 'rgba(239, 159, 39, 0.15)'
    ctx.rotate((-35 * Math.PI) / 180)

    const text = `${email} • DefiLords`
    const xStep = 220
    const yStep = 120

    for (let x = -canvas.height * 2; x < canvas.width + canvas.height; x += xStep) {
      for (let y = 0; y < canvas.height * 3; y += yStep) {
        ctx.fillText(text, x, y)
      }
    }
    ctx.restore()
  }

  useEffect(() => {
    draw()
    // Redraw every 30 seconds — harder to remove via DevTools
    const interval = setInterval(draw, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  useEffect(() => {
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 50 }}
    />
  )
}
