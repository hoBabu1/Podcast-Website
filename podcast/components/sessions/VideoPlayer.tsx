'use client'
import { useEffect, useState } from 'react'
import { VideoWatermark } from './VideoWatermark'

interface VideoPlayerProps {
  sessionId: number
  userEmail: string
}

interface VideoData {
  embedUrl: string
  isPlaceholder: boolean
}

type State = 'loading' | 'placeholder' | 'video' | 'error'

export function VideoPlayer({ sessionId, userEmail }: VideoPlayerProps) {
  const [state, setState] = useState<State>('loading')
  const [embedUrl, setEmbedUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/session/video?sessionId=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json() as Promise<VideoData>
      })
      .then((data) => {
        if (cancelled) return
        if (data.isPlaceholder) {
          setState('placeholder')
        } else {
          setEmbedUrl(data.embedUrl)
          setState('video')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (state === 'loading') {
    return (
      <div
        className="w-full rounded-lg bg-brand-surface animate-pulse"
        style={{ aspectRatio: '16/9' }}
        aria-hidden="true"
      />
    )
  }

  if (state === 'error') {
    return (
      <div
        className="w-full rounded-lg bg-brand-surface flex items-center justify-center"
        style={{ aspectRatio: '16/9' }}
      >
        <p className="text-red-400 text-sm text-center px-4">
          Video unavailable. Please refresh the page.
        </p>
      </div>
    )
  }

  if (state === 'placeholder') {
    return (
      <div
        className="w-full rounded-lg border border-brand-border bg-brand-surface flex flex-col items-center justify-center gap-3 px-4"
        style={{ aspectRatio: '16/9' }}
      >
        <span className="text-4xl" aria-hidden="true">
          🎬
        </span>
        <p className="text-brand-amber font-semibold text-lg text-center">Video Coming Soon</p>
        <p className="text-brand-muted text-sm text-center max-w-xs">
          Being recorded. Check back or follow us on Twitter.
        </p>
        <a
          href="https://x.com/defilordsss?s=21"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-brand-amber text-sm font-medium hover:text-brand-amberDark transition-colors"
        >
          Follow @DefiLords →
        </a>
      </div>
    )
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{ aspectRatio: '16/9' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`DefiLords Session ${sessionId}`}
      />
      <VideoWatermark email={userEmail} />
    </div>
  )
}
