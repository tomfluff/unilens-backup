/**
 * Shared font-size scale ratios — used by page font settings and selection resize.
 * Level 1 = 100%, Level 2 = 150%, Level 3 = 200%
 */
export const FONT_SCALE_LEVELS = [1, 1.5, 2] as const

export type FontScaleLevel = 1 | 2 | 3

export function levelToScale(level: FontScaleLevel): number {
  return FONT_SCALE_LEVELS[level - 1]
}

export function scaleToLevel(scale: number): FontScaleLevel {
  let best: FontScaleLevel = 1
  let diff = Infinity
  FONT_SCALE_LEVELS.forEach((s, i) => {
    const d = Math.abs(s - scale)
    if (d < diff) {
      diff = d
      best = (i + 1) as FontScaleLevel
    }
  })
  return best
}

export function a11yFontSizeToScale(size: 'standard' | 'large' | 'xlarge'): number {
  if (size === 'large') return 1.5
  if (size === 'xlarge') return 2
  return 1
}
