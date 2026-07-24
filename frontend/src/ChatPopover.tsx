import { useEffect, useRef, useState } from 'react'
import type { CaptureResult } from './capture'
import { settings } from './settings'

interface Msg {
  role: 'user' | 'assistant'
  text: string
  /** reply footer: provider · model · images · latency */
  info?: string
}

interface Props {
  x: number // client coords of the triggering click
  y: number
  captureId: string
  capture: CaptureResult
  backend: string
  onClose: () => void
}

const PANEL_W = 340
const PANEL_H = 420

export default function ChatPopover({ x, y, captureId, capture, backend, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [stored, setStored] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Ask the backend what it actually received for this capture
  useEffect(() => {
    if (captureId === 'local') {
      setStored('backend unreachable — nothing uploaded')
      return
    }
    fetch(`${backend}/api/capture/${captureId}`)
      .then((r) => r.json())
      .then((d) => {
        const f = d.files ?? {}
        const kb = (n: string) => (f[n] != null ? `✓ ${Math.round(f[n] / 1024)}KB` : '✗')
        setStored(`backend stored: page ${kb('capture.png')} · close-up ${kb('viewport.png')}`)
      })
      .catch(() => setStored('backend stored: (check failed)'))
  }, [backend, captureId])

  // Clamp popover inside viewport, near the cursor
  const left = Math.min(Math.max(x + 12, 8), window.innerWidth - PANEL_W - 8)
  const top = Math.min(Math.max(y + 12, 8), window.innerHeight - PANEL_H - 8)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const fmtInfo = (d: { provider: string; model: string; imagesSent: number; latencyMs: number }) =>
    `${d.provider} · ${d.model} · ${d.imagesSent} image${d.imagesSent === 1 ? '' : 's'} · ${(d.latencyMs / 1000).toFixed(1)}s`

  /** replace the text/info of the last (streaming) assistant message */
  const patchLast = (patch: Partial<Msg>) =>
    setMessages((m) => [...m.slice(0, -1), { ...m[m.length - 1], ...patch }])

  async function sendStreaming(text: string) {
    const res = await fetch(`${backend}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capture_id: captureId, message: text }),
    })
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}))
      setMessages((m) => [...m, { role: 'assistant', text: data.error ?? `HTTP ${res.status}` }])
      return
    }
    setMessages((m) => [...m, { role: 'assistant', text: '' }])
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? '' // keep incomplete tail
      for (const ev of events) {
        if (!ev.startsWith('data: ')) continue
        const data = JSON.parse(ev.slice(6))
        if (data.delta) {
          full += data.delta
          patchLast({ text: full })
        } else if (data.error) {
          patchLast({ text: full + `\n[error: ${data.error}]` })
        } else if (data.done) {
          patchLast({ info: fmtInfo(data) })
        }
      }
    }
  }

  async function sendPlain(text: string) {
    const res = await fetch(`${backend}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capture_id: captureId, message: text }),
    })
    const data = await res.json()
    const info = data.provider != null ? fmtInfo(data) : undefined
    setMessages((m) => [...m, { role: 'assistant', text: data.reply ?? data.error ?? 'No reply.', info }])
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy(true)
    try {
      if (settings.streamReplies) await sendStreaming(text)
      else await sendPlain(text)
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `Backend error: ${err}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: PANEL_W,
        height: PANEL_H,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        color: '#eee',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        zIndex: 2147483647,
        fontFamily: 'sans-serif',
        fontSize: 14,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#0f3460',
        }}
      >
        <span style={{ fontWeight: 700, color: '#00c8ff' }}>UniLens</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <img
          src={capture.image}
          alt="page capture"
          style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #333', display: 'block' }}
        />
        {capture.viewportImage && (
          <img
            src={capture.viewportImage}
            alt="close-up of current view"
            style={{ maxWidth: '55%', borderRadius: 6, border: '1px solid #446', display: 'block', marginTop: 6 }}
          />
        )}
        <div style={{ fontSize: 11, color: '#889', margin: '6px 0 2px' }}>
          click ({capture.meta.clickX}, {capture.meta.clickY}) · scroll {capture.meta.scrollDepth}% ·{' '}
          {capture.meta.trace.length} trace pts
          {capture.meta.zoom !== 1 && <> · zoom {Math.round(capture.meta.zoom * 100)}%</>}
        </div>
        <div style={{ fontSize: 11, color: '#7a9', margin: '0 0 12px' }}>{stored}</div>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: '6px 0',
              padding: '8px 12px',
              borderRadius: 10,
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? '#0f3460' : '#26263e',
              marginLeft: m.role === 'user' ? 'auto' : 0,
            }}
          >
            {m.text}
            {m.info && <div style={{ fontSize: 10, color: '#88a', marginTop: 6 }}>{m.info}</div>}
          </div>
        ))}
        {busy && <div style={{ color: '#889', padding: 8 }}>…</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #333' }}>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about this page…"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #444',
            background: '#26263e',
            color: '#eee',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={busy}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#00c8ff',
            color: '#08182e',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
