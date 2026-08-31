/**
 * Read-aloud for the selection — rate levels and sentence splitting (pure
 * logic, no DOM or speech API).
 *
 * Same approach as textAdjustLevels.ts: only value definitions and
 * calculations live here. The actual speaking happens in speakSelection.ts.
 */

/** Speech rate levels (0 = slow ... 3 = fast). Default is 1 (normal speed). */
export const SPEECH_RATE_LEVELS = [0, 1, 2, 3] as const

export type SpeechRateLevel = (typeof SPEECH_RATE_LEVELS)[number]

/**
 * SpeechSynthesisUtterance.rate for each level.
 *
 * The upper bound is capped at 1.6 because most voices start slurring
 * phonemes around 2.0, which makes speech harder to follow, not easier.
 * The low end is capped at 0.8 rather than 0.5, since going lower makes
 * speech sound unnaturally drawn out.
 */
export const SPEECH_RATES: Record<SpeechRateLevel, number> = {
  0: 0.8,
  1: 1,
  2: 1.3,
  3: 1.6,
}

export const DEFAULT_SPEECH_RATE_LEVEL: SpeechRateLevel = 1

/** Always falls back to the default (normal) rate, even if the stored value is corrupted. */
export function normalizeSpeechRateLevel(value: unknown): SpeechRateLevel {
  return SPEECH_RATE_LEVELS.includes(value as SpeechRateLevel)
    ? (value as SpeechRateLevel)
    : DEFAULT_SPEECH_RATE_LEVEL
}

export function speechRateValue(level: SpeechRateLevel): number {
  return SPEECH_RATES[level]
}

/** A language-independent hint like "×1.3". */
export function speechRateHint(level: SpeechRateLevel): string {
  return `×${SPEECH_RATES[level]}`
}

// ── Sentence splitting ──────────────────────────────────────────────────────

/**
 * Max character count handed to a single utterance.
 *
 * Passing a long text as one utterance hits a known bug in Chrome-family
 * browsers where speech stops after roughly 15 seconds; splitting it into
 * shorter pieces and playing them in sequence avoids that. Breaking too
 * finely leaves unnatural pauses at the seams, so this length is a target
 * that still prefers breaking at sentence-ending marks.
 */
export const SPEECH_CHUNK_MAX = 180

/** Marks treated as the end of a sentence (both Japanese and English). */
const SENTENCE_ENDINGS = ['。', '！', '？', '．', '\n', '.', '!', '?', ';']

/** Don't force a break when a sentence-ending mark is only available too close to the start (a floor against overly small chunks). */
const MIN_CHUNK_RATIO = 0.4

export interface SpeechChunk {
  text: string
  /** Position from the start of the original text. Used for the read-aloud highlight. */
  offset: number
}

function lastSentenceEnd(slice: string): number {
  let found = -1
  for (const mark of SENTENCE_ENDINGS) {
    const index = slice.lastIndexOf(mark)
    if (index > found) found = index
  }
  return found
}

/**
 * Splits text for read-aloud.
 *
 * Returns each chunk with its position (offset) in the original text intact,
 * so a character position during speech can be mapped back to its place in
 * the original DOM.
 */
export function splitSpeechChunks(text: string, maxLength = SPEECH_CHUNK_MAX): SpeechChunk[] {
  const chunks: SpeechChunk[] = []
  const limit = Math.max(1, Math.floor(maxLength))
  const minBreak = limit * MIN_CHUNK_RATIO
  let index = 0

  while (index < text.length) {
    let end = Math.min(index + limit, text.length)

    if (end < text.length) {
      const slice = text.slice(index, end)
      const sentence = lastSentenceEnd(slice)
      if (sentence >= minBreak) {
        end = index + sentence + 1
      } else {
        const space = slice.lastIndexOf(' ')
        if (space >= minBreak) end = index + space + 1
      }
    }

    const piece = text.slice(index, end)
    // A whitespace-only piece would be silent anyway, so drop it and just advance the offset.
    if (piece.trim()) chunks.push({ text: piece, offset: index })
    index = end
  }

  return chunks
}

/**
 * For environments where the speech event doesn't report word length
 * (no charLength support), approximates it by treating everything up to the
 * next delimiter as one word.
 */
export function guessWordLength(text: string, start: number): number {
  if (start >= text.length) return 0
  const match = /[\s、。！？．,.!?;:]/.exec(text.slice(start))
  const length = match ? match.index : text.length - start
  return Math.max(1, length)
}
