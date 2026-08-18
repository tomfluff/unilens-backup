import { useEffect, useRef, useState } from 'react'
import type { CaptureResult } from './capture'
import { getSettings, useSettings } from './settings'
import { speak, stopSpeaking, listen, sttSupported, type SpeechState } from './speech'

interface Msg {
  role: 'user' | 'assistant'
  text: string
  /** reply footer: provider · model · images · latency */
  info?: string
}

/**
 * Minimal markdown for a 340px chat bubble: bold, inline code, dash bullets,
 * headings flattened to bold. HTML is escaped BEFORE any transform, so the
 * only tags in the output are ones we emit ourselves.
 */
function mdLite(text: string): { __html: string } {
  let h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h
    .replace(/^#{1,4} (.+)$/gm, '<b>$1</b>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,0.12);border-radius:3px;padding:0 4px">$1</code>')
    .replace(/^[-*] (.+)$/gm, '• $1')
  return { __html: h }
}

interface Props {
  x: number // client coords of the triggering click
  y: number
  captureId: string
  capture: CaptureResult
  backend: string
  sessionId: string | null
  onClose: () => void
  /** pinned position carried over from the previous popover, if the user pinned it */
  initialPos?: { left: number; top: number } | null
  pinned: boolean
  onTogglePin: (pos: { left: number; top: number } | null) => void
  onMove: (pos: { left: number; top: number }) => void
}

const PANEL_W = 340
const PANEL_H = 420

export default function ChatPopover({
  x,
  y,
  captureId,
  capture,
  backend,
  sessionId,
  onClose,
  initialPos,
  pinned,
  onTogglePin,
  onMove,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [stored, setStored] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // store subscription: re-renders when settings change, so text size / contrast apply live
  const settings = useSettings()

  const fs = settings.chatFontSize
  const hc = settings.highContrast
  // high contrast: pure black surfaces, white text, yellow accents (WCAG-friendly)
  const C = hc
    ? {
        panelBg: '#000',
        headerBg: '#000',
        headerBorder: '2px solid #ffd700',
        accent: '#ffd700',
        text: '#fff',
        dim: '#fff',
        userBubble: '#1a1a1a',
        aiBubble: '#1a1a1a',
        bubbleBorder: '1px solid #ffd700',
        inputBg: '#000',
        inputBorder: '2px solid #ffd700',
        chipBg: '#000',
        chipBorder: '1px solid #ffd700',
        chipText: '#ffd700',
      }
    : {
        panelBg: '#1a1a2e',
        headerBg: '#0f3460',
        headerBorder: 'none',
        accent: '#00c8ff',
        text: '#eee',
        dim: '#889',
        userBubble: '#0f3460',
        aiBubble: '#26263e',
        bubbleBorder: 'none',
        inputBg: '#26263e',
        inputBorder: '1px solid #444',
        chipBg: '#22224a',
        chipBorder: '1px solid #345',
        chipText: '#9cf',
      }

  const [sessionCaptures, setSessionCaptures] = useState(1)
  const [listening, setListening] = useState(false)
  const stopListenRef = useRef<(() => void) | null>(null)
  /** which message is being spoken and its phase */
  const [speaking, setSpeaking] = useState<{ idx: number; phase: SpeechState } | null>(null)

  function speakMessage(idx: number, text: string) {
    if (speaking?.idx === idx) {
      stopSpeaking()
      return
    }
    speak(text, (s) => setSpeaking(s === 'idle' ? null : { idx, phase: s }))
  }

  // stop any speech/mic when the popover unmounts
  useEffect(
    () => () => {
      stopSpeaking()
      stopListenRef.current?.()
    },
    [],
  )

  function toggleMic() {
    if (listening) {
      stopListenRef.current?.()
      return
    }
    const stop = listen(
      (transcript) => setInput(transcript),
      () => setListening(false),
    )
    if (stop) {
      stopListenRef.current = stop
      setListening(true)
    }
  }

  // Continuity: seed the running conversation from the session history
  useEffect(() => {
    if (!sessionId || captureId === 'local') return
    fetch(`${backend}/api/session/${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history)) setMessages(d.history.map((h: { role: string; text: string }) => ({ role: h.role as Msg['role'], text: h.text })))
        if (d.captures) setSessionCaptures(d.captures)
      })
      .catch(() => {})
  }, [backend, sessionId, captureId])

  // Ask the backend what it actually received for this capture
  useEffect(() => {
    if (captureId === 'local') {
      setStored('backend unreachable — nothing uploaded')
      return
    }
    fetch(`${backend}/api/capture/${encodeURIComponent(captureId)}`)
      .then((r) => r.json())
      .then((d) => {
        const f = d.files ?? {}
        const kb = (n: string) => (f[n] != null ? `✓ ${Math.round(f[n] / 1024)}KB` : '✗')
        setStored(`backend stored: page ${kb('capture.png')} · close-up ${kb('viewport.png')}`)
      })
      .catch(() => setStored('backend stored: (check failed)'))
  }, [backend, captureId])

  // Clamp popover inside viewport, near the cursor (or restore pinned position)
  const clamp = (p: { left: number; top: number }) => ({
    left: Math.min(Math.max(p.left, 8), window.innerWidth - PANEL_W - 8),
    top: Math.min(Math.max(p.top, 8), window.innerHeight - PANEL_H - 8),
  })
  const [pos, setPos] = useState(() => clamp(initialPos ?? { left: x + 12, top: y + 12 }))
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  function onHeaderPointerDown(e: React.PointerEvent) {
    if (!settings.dragPopover) return
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    dragRef.current = { dx: e.clientX - pos.left, dy: e.clientY - pos.top }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const p = clamp({ left: e.clientX - dragRef.current.dx, top: e.clientY - dragRef.current.dy })
    setPos(p)
    onMove(p)
  }
  function onHeaderPointerUp() {
    dragRef.current = null
  }

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
      body: JSON.stringify({ capture_id: captureId, message: text, session_id: sessionId }),
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
          // live read: the user may toggle auto-read while the reply streams
          if (getSettings().autoRead && full) {
            const idx = messages.length + 1 // the assistant bubble just added
            speak(full, (s) => setSpeaking(s === 'idle' ? null : { idx, phase: s }))
          }
        }
      }
    }
  }

  async function sendPlain(text: string) {
    const res = await fetch(`${backend}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capture_id: captureId, message: text, session_id: sessionId }),
    })
    const data = await res.json()
    const info = data.provider != null ? fmtInfo(data) : undefined
    setMessages((m) => [...m, { role: 'assistant', text: data.reply ?? data.error ?? 'No reply.', info }])
    // live read: the user may toggle auto-read while the request is in flight
    if (getSettings().autoRead && data.reply) speak(data.reply)
  }

  async function sendText(text: string) {
    if (!text || busy) return
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

  function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendText(text)
  }

  const QUICK_ACTIONS: [string, string][] = [
    ['Explain this', 'Explain what I am looking at, simply.'],
    ['Summarize', 'Summarize this page briefly.'],
    ['→ English', 'Translate the content I am looking at into English.'],
  ]

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: PANEL_W,
        height: PANEL_H,
        display: 'flex',
        flexDirection: 'column',
        background: C.panelBg,
        color: C.text,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        border: hc ? '2px solid #ffd700' : 'none',
        zIndex: 2147483647,
        fontFamily: 'sans-serif',
        fontSize: fs,
        overflow: 'hidden',
      }}
    >
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: C.headerBg,
          borderBottom: C.headerBorder,
          cursor: settings.dragPopover ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <span style={{ fontWeight: 700, color: C.accent }}>UniLens</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onTogglePin(pinned ? null : pos)}
            title={pinned ? 'Pinned — click to unpin (reopen at cursor)' : 'Pin position for next captures'}
            style={{
              background: pinned ? '#00c8ff' : 'none',
              border: 'none',
              borderRadius: 6,
              color: pinned ? '#08182e' : '#aaa',
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 8px',
              fontWeight: 700,
            }}
          >
            📌{pinned ? ' pinned' : ''}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </span>
      </div>

      {/* contain: at the top or bottom of the messages, keep the wheel here instead of
          handing it to the page behind — the list auto-scrolls to the end, so without
          this every further scroll moves the page instead of the chat */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: 12 }}>
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
        <div style={{ fontSize: Math.max(11, fs - 3), color: C.dim, margin: '6px 0 2px' }}>
          click ({capture.meta.clickX}, {capture.meta.clickY}) · scroll {capture.meta.scrollDepth}% ·{' '}
          {capture.meta.trace.length} trace pts
          {capture.meta.zoom !== 1 && <> · zoom {Math.round(capture.meta.zoom * 100)}%</>}
          {capture.meta.region && (
            <>
              {' '}
              · region {capture.meta.region.w}×{capture.meta.region.h}
            </>
          )}
        </div>
        <div style={{ fontSize: Math.max(11, fs - 3), color: hc ? '#fff' : '#7a9', margin: 0 }}>
          {stored}
          {sessionId && sessionCaptures > 1 && ` · session: ${sessionCaptures} captures`}
        </div>
        {capture.meta.element && (
          <div style={{ fontSize: Math.max(11, fs - 3), color: hc ? '#fff' : '#a9c', margin: '2px 0 0' }}>
            clicked: &lt;{capture.meta.element.tag}&gt;
            {capture.meta.element.text && ` “${capture.meta.element.text.slice(0, 60)}${capture.meta.element.text.length > 60 ? '…' : ''}”`}
            {capture.meta.element.nearestHeading && ` · under “${capture.meta.element.nearestHeading}”`}
          </div>
        )}
        <div style={{ margin: '0 0 12px' }} />
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: '6px 0',
              padding: '8px 12px',
              borderRadius: 10,
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? C.userBubble : C.aiBubble,
              border: C.bubbleBorder,
              marginLeft: m.role === 'user' ? 'auto' : 0,
            }}
          >
            {m.role === 'assistant' ? <span dangerouslySetInnerHTML={mdLite(m.text)} /> : m.text}
            {m.role === 'assistant' && m.text && (
              <button
                onClick={() => speakMessage(i, m.text)}
                title={speaking?.idx === i ? (speaking.phase === 'loading' ? 'Preparing audio…' : 'Stop') : 'Read aloud'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: Math.max(12, fs - 2),
                  marginLeft: 6,
                  opacity: speaking?.idx === i ? 1 : 0.7,
                }}
              >
                {speaking?.idx === i ? (speaking.phase === 'loading' ? '⏳' : '⏹') : '🔊'}
              </button>
            )}
            {m.info && (
              <div style={{ fontSize: Math.max(10, fs - 4), color: hc ? '#ffd700' : '#88a', marginTop: 6 }}>{m.info}</div>
            )}
          </div>
        ))}
        {busy && <div style={{ color: '#889', padding: 8 }}>…</div>}
      </div>

      {settings.quickActions && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 10px 0', flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map(([label, prompt]) => (
            <button
              key={label}
              onClick={() => sendText(prompt)}
              disabled={busy}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                border: C.chipBorder,
                background: C.chipBg,
                color: C.chipText,
                fontSize: Math.max(12, fs - 2),
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.5 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #333' }}>
        {settings.voiceInput && sttSupported && (
          <button
            onClick={toggleMic}
            title={listening ? 'Stop listening' : 'Speak your question'}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: listening ? '#e33' : C.inputBg,
              color: C.text,
              cursor: 'pointer',
              fontSize: fs,
            }}
          >
            🎤
          </button>
        )}
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          // Enter that confirms an IME composition (Japanese, Chinese, Korean)
          // must not submit the half-typed text. keyCode 229 covers browsers
          // that report the confirming Enter with isComposing already false.
          onKeyDown={(e) =>
            e.key === 'Enter' && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229 && send()
          }
          placeholder="Ask about this page…"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: C.inputBorder,
            background: C.inputBg,
            color: C.text,
            fontSize: fs,
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
            background: C.accent,
            color: hc ? '#000' : '#08182e',
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
