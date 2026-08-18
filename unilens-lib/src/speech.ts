/**
 * Browser-native voice: speechSynthesis for TTS, SpeechRecognition for STT.
 * Zero backend / zero cost v1 — the popover buttons are engine-agnostic, so an
 * API-based backend (assets26 pattern) can replace this later without UI change.
 */

/** ja if the text contains kana/kanji, else the browser locale */
function guessLang(text: string): string {
  return /[぀-ヿ一-鿿]/.test(text) ? 'ja-JP' : navigator.language || 'en-US'
}

/** markdown-ish reply → speakable plain text */
function toSpeakable(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*•] /gm, '')
    .replace(/^#{1,4} /gm, '')
}

let backendUrl = ''
let audioEl: HTMLAudioElement | null = null
let stateCb: ((s: SpeechState) => void) | null = null

export type SpeechState = 'loading' | 'playing' | 'idle'

/** set by init() — enables API TTS (better mixed-language voices) */
export function setSpeechBackend(url: string) {
  backendUrl = url
}

function setState(s: SpeechState) {
  stateCb?.(s)
  if (s === 'idle') stateCb = null
}

function speakNative(text: string) {
  const u = new SpeechSynthesisUtterance(toSpeakable(text))
  u.lang = guessLang(text)
  u.onstart = () => setState('playing')
  u.onend = () => setState('idle')
  u.onerror = () => setState('idle')
  speechSynthesis.speak(u)
}

/**
 * API voice first (streamed mp3, plays while downloading; handles mixed ja/en);
 * native fallback on any failure. onState tracks loading → playing → idle.
 */
export async function speak(text: string, onState?: (s: SpeechState) => void) {
  stopSpeaking()
  stateCb = onState ?? null
  setStateSafe('loading')
  const plain = toSpeakable(text)
  try {
    const res = await fetch(`${backendUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: plain }),
    })
    if (!res.ok) throw new Error(`tts ${res.status}`)
    const { id } = await res.json()
    audioEl = new Audio(`${backendUrl}/api/tts/${encodeURIComponent(id)}.mp3`)
    audioEl.onplaying = () => setState('playing')
    audioEl.onended = () => {
      audioEl = null
      setState('idle')
    }
    audioEl.onerror = () => {
      audioEl = null
      setState('idle')
    }
    await audioEl.play()
  } catch {
    speakNative(text)
  }
}

function setStateSafe(s: SpeechState) {
  stateCb?.(s)
}

export function stopSpeaking() {
  speechSynthesis.cancel()
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
  setState('idle')
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking || (audioEl != null && !audioEl.paused)
}

// ── STT ────────────────────────────────────────────────────────────────────
type RecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const sttSupported = recognitionCtor() != null

/**
 * Start listening; transcript goes to onResult as it firms up, onEnd fires when
 * recognition stops (silence or stop()). Returns a stop function, or null if
 * unsupported.
 */
export function listen(onResult: (transcript: string) => void, onEnd: () => void): (() => void) | null {
  const Ctor = recognitionCtor()
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = navigator.language || 'en-US'
  rec.interimResults = true
  rec.onresult = (e) => {
    let text = ''
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
    onResult(text)
  }
  rec.onend = onEnd
  rec.onerror = onEnd
  rec.start()
  return () => rec.stop()
}
