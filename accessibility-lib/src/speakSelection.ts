/**
 * Read-aloud for the selection — voices it with the Web Speech API (speechSynthesis).
 *
 * Division of responsibilities:
 * - speechLevels.ts   … rate levels and sentence splitting (pure calculation, no DOM or speech API)
 * - this file         … extracting the selection, controlling speech, highlighting the read position
 *
 * Design principles:
 * - The target range is shared with selectionTextSize.ts. If the "resized
 *   range" and the "range read aloud" ever disagreed, the visitor would have
 *   no way to tell why — so range resolution lives in one place only.
 * - Never rewrite the page's DOM. The read-position highlight uses the CSS
 *   Custom Highlight API; on unsupported browsers it just skips the
 *   highlight and speech continues normally.
 * - Importing this module must never throw even where the speech API is
 *   unavailable (the panel decides what to show based on support).
 */
import { getA11yLang } from './accessibilityI18n'
import { getActiveSelectionRange } from './selectionTextSize'
import { settings } from './settings'
import { isUniLensOverlayNode } from './domIds'
import {
  guessWordLength,
  normalizeSpeechRateLevel,
  speechRateValue,
  splitSpeechChunks,
  type SpeechChunk,
} from './speechLevels'

export type SpeechState = 'idle' | 'speaking' | 'paused'

export interface SpeechTargetInfo {
  /** Whether there's a range to read aloud (while speaking, the text being spoken counts as the target). */
  hasTarget: boolean
  /** Character count with whitespace collapsed. Used for the panel display. */
  charCount: number
}

export interface SpeakResult {
  ok: boolean
  charCount: number
}

/** The whole range currently being read aloud (pale amber). */
const RANGE_HIGHLIGHT_NAME = 'unilens-speech-range'
/** The word currently being read (deep orange). Rendered above the range highlight. */
const WORD_HIGHLIGHT_NAME = 'unilens-speech-word'
const HIGHLIGHT_STYLE_ID = 'unilens-speech-highlight'
const SPEAKING_ATTR = 'data-unilens-speaking'

function isUniLensSelection(selection: Selection): boolean {
  if (selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  return isUniLensOverlayNode(element)
}

/**
 * Calling speak() right after cancel() can fail to start speech
 * (Chrome-family browsers). For the first chunk only, wait this long and
 * retry if nothing has started.
 */
const FIRST_CHUNK_RETRY_MS = 250

// ── Speech API entry point ────────────────────────────────────────────────

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return 'speechSynthesis' in window ? window.speechSynthesis : null
}

export function isSpeechSupported(): boolean {
  return synth() != null && typeof window.SpeechSynthesisUtterance === 'function'
}

// ── Read-position highlight (CSS Custom Highlight API) ────────────────────

interface HighlightLike {
  priority?: number
}

interface HighlightRegistryLike {
  set(name: string, highlight: HighlightLike): void
  delete(name: string): void
}

type HighlightConstructor = new (...ranges: Range[]) => HighlightLike

/** null on unsupported browsers — the caller just proceeds without the highlight. */
function highlightApi(): { registry: HighlightRegistryLike; ctor: HighlightConstructor } | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    CSS?: { highlights?: HighlightRegistryLike }
    Highlight?: HighlightConstructor
  }
  const registry = scope.CSS?.highlights
  const ctor = scope.Highlight
  return registry && ctor ? { registry, ctor } : null
}

/**
 * Highlight styling.
 *
 * Colors are fixed rather than following the page's display settings.
 * Keeping enough brightness contrast under both dark and high-contrast
 * themes, so "where am I currently reading" is never lost, takes priority
 * over matching the page. The range (pale) and the current word (deep) are
 * differentiated by lightness as well as hue, so they stay distinguishable
 * even when color differences are hard to perceive.
 *
 * `::selection` is made transparent because a selection's own paint renders
 * after (i.e. on top of) the Custom Highlight — without this, the read
 * position would be hidden under the selection color. !important is added
 * so this still wins even when the page defines its own `::selection`. The
 * attribute is only toggled on while speech is active.
 *
 * The text color is set to an actual color rather than `inherit`, because
 * `::selection`'s inherit picks up the color from an ancestor's own
 * `::selection`. If the page specifies white text there, it would stay white
 * on top of our pale highlight background and become unreadable. The
 * selection being read aloud is always the read target itself (i.e. both
 * highlight tones are light backgrounds), so a fixed dark text color is safe.
 */
const HIGHLIGHT_TEXT_COLOR = '#1b1b1b'

function ensureHighlightStyle() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  style.textContent = [
    `::highlight(${RANGE_HIGHLIGHT_NAME}){background-color:#ffe9b0;color:${HIGHLIGHT_TEXT_COLOR};}`,
    `::highlight(${WORD_HIGHLIGHT_NAME}){background-color:#ff9f1c;color:${HIGHLIGHT_TEXT_COLOR};}`,
    `html[${SPEAKING_ATTR}] ::selection{` +
      `background-color:transparent !important;color:${HIGHLIGHT_TEXT_COLOR} !important;}`,
  ].join('')
  document.head.appendChild(style)
}

function highlightEnabled(): boolean {
  return settings.speechHighlight && highlightApi() != null
}

function setHighlightRange(name: string, range: Range, priority: number) {
  const api = highlightApi()
  if (!api) return
  try {
    const highlight = new api.ctor(range)
    // Render the current word above the range highlight, without depending on registration order.
    highlight.priority = priority
    api.registry.set(name, highlight)
  } catch {
    api.registry.delete(name)
  }
}

/** Starts the highlight that shows speech is in progress. No-op when unsupported or turned off. */
function startHighlighting() {
  if (!highlightEnabled()) return

  ensureHighlightStyle()
  document.documentElement.setAttribute(SPEAKING_ATTR, 'true')

  const range = buildRange(0, currentText.length)
  if (range) setHighlightRange(RANGE_HIGHLIGHT_NAME, range, 0)
}

function stopHighlighting() {
  document.documentElement.removeAttribute(SPEAKING_ATTR)
  const registry = highlightApi()?.registry
  registry?.delete(RANGE_HIGHLIGHT_NAME)
  registry?.delete(WORD_HIGHLIGHT_NAME)
}

/**
 * Applies a highlight-setting toggle to the current speech immediately.
 * Turning it on lights up the range being read right away; turning it off
 * clears any highlight that was left showing.
 */
export function syncSpeechHighlight() {
  if (state !== 'idle' && highlightEnabled()) startHighlighting()
  else stopHighlighting()
}

// ── Extracting the selection ──────────────────────────────────────────────

interface TextSegment {
  node: Text
  /** Start position within the spoken text. */
  start: number
  /** End position within the spoken text. */
  end: number
  /** Start position within node.data (starts mid-node at the range's edge). */
  nodeOffset: number
}

/**
 * Walks the text nodes within the range in document order, building a map
 * between the spoken text and their positions. This matches the order of
 * Range.toString(), so a character position reported by a speech event can
 * be mapped straight back to its place in the original DOM.
 */
function collectSegments(range: Range): { text: string; segments: TextSegment[] } {
  const segments: TextSegment[] = []
  let text = ''

  const container = range.commonAncestorContainer
  const root = container.nodeType === Node.TEXT_NODE ? container.parentNode : container
  if (!root) return { text, segments }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const textNode = node as Text
    if (!range.intersectsNode(textNode)) continue

    const from = textNode === range.startContainer ? range.startOffset : 0
    const to = textNode === range.endContainer ? range.endOffset : textNode.data.length
    const piece = textNode.data.slice(from, to)
    // Skip nodes that only touch the range's edge — their piece ends up empty.
    if (!piece) continue

    segments.push({ node: textNode, start: text.length, end: text.length + piece.length, nodeOffset: from })
    text += piece
  }

  return { text, segments }
}

function normalizedLength(text: string): number {
  return text.replace(/\s+/g, ' ').trim().length
}

/**
 * The language used for speech. Checked in order: a lang attribute
 * enclosing the range → `<html lang>` → the panel's language. This affects
 * both voice selection and pronunciation, so the page's own declaration
 * always takes priority.
 */
function detectSpeechLang(range: Range): string {
  const node = range.commonAncestorContainer
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  const tagged = element?.closest?.('[lang]')?.getAttribute('lang')?.trim()
  if (tagged) return tagged

  const html = document.documentElement.lang.trim()
  if (html) return html

  return getA11yLang() === 'ja' ? 'ja-JP' : 'en-US'
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = synth()?.getVoices() ?? []
  if (voices.length === 0) return null

  // Depending on the environment this can show up as either "ja_JP" or "ja-JP", so normalize before comparing.
  const normalize = (tag: string) => tag.toLowerCase().replace(/_/g, '-')
  const wanted = normalize(lang)
  const primary = wanted.split('-')[0]

  return (
    voices.find((v) => normalize(v.lang) === wanted) ??
    voices.find((v) => normalize(v.lang).split('-')[0] === primary) ??
    null
  )
}

// ── State ──────────────────────────────────────────────────────────────────

let state: SpeechState = 'idle'
let currentText = ''
let currentLang = ''
let segments: TextSegment[] = []
let chunks: SpeechChunk[] = []
let chunkIndex = 0

/**
 * A sequence number for each speech session.
 *
 * Some implementations fire the in-progress utterance's end / error when
 * cancel() is called; taking that at face value would incorrectly trigger
 * "advance to the next chunk". Bumping this number ensures every stale
 * callback's number no longer matches, so they're reliably discarded.
 */
let sessionId = 0

let speakActive = false
let onVoicesChanged: (() => void) | null = null
let onPageHide: (() => void) | null = null
let onSelectionChange: (() => void) | null = null

const listeners: (() => void)[] = []

/** Notifies only on play/pause/stop transitions (never called for per-character progress during speech). */
export function onSpeechChange(cb: () => void): () => void {
  listeners.push(cb)
  return () => listeners.splice(listeners.indexOf(cb), 1)
}

function setState(next: SpeechState) {
  if (state === next) return
  state = next
  listeners.forEach((cb) => cb())
}

export function getSpeechState(): SpeechState {
  return state
}

export function getSpeechTarget(): SpeechTargetInfo {
  if (state !== 'idle') {
    return { hasTarget: true, charCount: normalizedLength(currentText) }
  }

  const range = getActiveSelectionRange()
  const charCount = range ? normalizedLength(range.toString()) : 0
  return { hasTarget: charCount > 0, charCount }
}

// ── Speaking ───────────────────────────────────────────────────────────────

/**
 * Converts a position in the spoken text back into a DOM Range.
 * The page can be mutated while speech is in progress, so this returns null
 * when the mapping no longer resolves.
 */
function buildRange(start: number, end: number): Range | null {
  const to = Math.min(end, currentText.length)
  const startSegment = segments.find((s) => start >= s.start && start < s.end)
  const endSegment = segments.find((s) => to > s.start && to <= s.end)
  if (!startSegment || !endSegment) return null
  if (!startSegment.node.isConnected || !endSegment.node.isConnected) return null

  try {
    const range = document.createRange()
    range.setStart(startSegment.node, startSegment.nodeOffset + (start - startSegment.start))
    range.setEnd(endSegment.node, endSegment.nodeOffset + (to - endSegment.start))
    return range
  } catch {
    return null
  }
}

function highlightWord(start: number, length: number) {
  const range = buildRange(start, start + length)
  if (range) setHighlightRange(WORD_HIGHLIGHT_NAME, range, 1)
  else highlightApi()?.registry.delete(WORD_HIGHLIGHT_NAME)
}

function speakChunk(index: number, session: number) {
  const engine = synth()
  if (!engine) return

  if (index >= chunks.length) {
    finishSpeech(session)
    return
  }

  chunkIndex = index
  const chunk = chunks[index]
  const utterance = new SpeechSynthesisUtterance(chunk.text)
  utterance.lang = currentLang
  utterance.rate = speechRateValue(normalizeSpeechRateLevel(settings.speechRateLevel))
  const voice = pickVoice(currentLang)
  if (voice) utterance.voice = voice

  let started = false
  utterance.onstart = () => {
    started = true
  }

  utterance.onboundary = (event) => {
    if (session !== sessionId || !settings.speechHighlight) return
    // Some implementations report finer-grained units than a word, but the highlight is always kept word-sized.
    if (event.name && event.name !== 'word') return

    const start = chunk.offset + event.charIndex
    const reported = (event as SpeechSynthesisEvent & { charLength?: number }).charLength
    highlightWord(start, reported && reported > 0 ? reported : guessWordLength(currentText, start))
  }

  utterance.onend = () => {
    if (session !== sessionId) return
    speakChunk(index + 1, session)
  }

  utterance.onerror = (event) => {
    if (session !== sessionId) return
    const code = event.error
    if (code === 'interrupted' || code === 'canceled') return
    stopSpeech()
  }

  engine.speak(utterance)

  if (index === 0) {
    window.setTimeout(() => {
      if (session !== sessionId || started) return
      if (engine.speaking || engine.pending) return
      engine.speak(utterance)
    }, FIRST_CHUNK_RETRY_MS)
  }
}

function finishSpeech(session: number) {
  if (session !== sessionId) return
  sessionId += 1
  stopHighlighting()
  setState('idle')
}

/**
 * Reads the currently selected range aloud.
 * If speech is already in progress, cuts it off and starts reading the new range instead.
 */
export function speakSelection(): SpeakResult {
  const engine = synth()
  if (!engine) return { ok: false, charCount: 0 }

  stopSpeech()

  const range = getActiveSelectionRange()
  if (!range) return { ok: false, charCount: 0 }

  const collected = collectSegments(range)
  if (!collected.text.trim()) return { ok: false, charCount: 0 }

  const nextChunks = splitSpeechChunks(collected.text)
  if (nextChunks.length === 0) return { ok: false, charCount: 0 }

  currentText = collected.text
  segments = collected.segments
  chunks = nextChunks
  currentLang = detectSpeechLang(range)
  startHighlighting()

  sessionId += 1
  setState('speaking')
  speakChunk(0, sessionId)

  return { ok: true, charCount: normalizedLength(currentText) }
}

export function pauseSpeech(): boolean {
  const engine = synth()
  if (!engine || state !== 'speaking') return false
  engine.pause()
  setState('paused')
  return true
}

export function resumeSpeech(): boolean {
  const engine = synth()
  if (!engine || state !== 'paused') return false
  engine.resume()
  setState('speaking')
  return true
}

/** Stops speech. Returns false if nothing was playing (safe to call regardless). */
export function stopSpeech(): boolean {
  const wasActive = state !== 'idle'
  sessionId += 1
  stopHighlighting()
  if (wasActive) synth()?.cancel()
  setState('idle')
  return wasActive
}

/**
 * Restarts reading after the rate has changed.
 *
 * The rate can't be changed mid-utterance, so this restarts from the
 * beginning of the chunk currently being read. That's only a rewind of a
 * few dozen characters, which loses less than stopping and reconfiguring
 * would.
 *
 * Does nothing while paused — starting playback just from touching the rate
 * would contradict the user's intent. In that case, the new rate takes
 * effect from the next chunk once playback is resumed.
 */
export function restartSpeechWithCurrentRate(): boolean {
  const engine = synth()
  if (!engine || state !== 'speaking' || chunks.length === 0) return false

  const from = chunkIndex
  sessionId += 1
  engine.cancel()
  setState('speaking')
  speakChunk(from, sessionId)
  return true
}

export function initSpeakSelection() {
  if (speakActive) return
  speakActive = true
  if (!isSpeechSupported()) return

  const engine = synth()
  if (engine) {
    engine.getVoices()
    onVoicesChanged = () => engine.getVoices()
    engine.addEventListener('voiceschanged', onVoicesChanged)
  }

  onPageHide = () => stopSpeech()
  window.addEventListener('pagehide', onPageHide)

  onSelectionChange = () => {
    if (state === 'idle') return

    const selection = window.getSelection()
    // Don't stop just because a click cleared the selection — if speech cut
    // out as collateral damage from operating the panel or clicking
    // elsewhere on the page, the visitor would have to redo the selection
    // just to hear it again.
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return
    if (isUniLensSelection(selection)) return
    if (selection.getRangeAt(0).toString() === currentText) return

    stopSpeech()
  }
  document.addEventListener('selectionchange', onSelectionChange)
}

export function destroySpeakSelection() {
  if (!speakActive) return
  speakActive = false
  stopSpeech()
  const engine = synth()
  if (engine && onVoicesChanged) engine.removeEventListener('voiceschanged', onVoicesChanged)
  if (onPageHide) window.removeEventListener('pagehide', onPageHide)
  if (onSelectionChange) document.removeEventListener('selectionchange', onSelectionChange)
  onVoicesChanged = null
  onPageHide = null
  onSelectionChange = null
  document.getElementById(HIGHLIGHT_STYLE_ID)?.remove()
}
