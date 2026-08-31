/**
 * One-tap presets (low vision / color vision / mild / senior / high contrast / focus).
 *
 * Pressing the same button again turns it off (toggle). Never more than one
 * active at once — applying a preset first resets the fields any preset
 * touches back to the defaults, then overwrites them. This keeps the data-* /
 * CSS variables and each button's state in the panel always in sync.
 */
import {
  A11Y_DEFAULTS,
  a11ySettings,
  patchA11ySettings,
  type A11ySettings,
} from './accessibilityStore'
import { runAutoTextAction } from './autoTextSize'

export type A11yPresetId =
  | 'lowVision'
  | 'colorVision'
  | 'mild'
  | 'senior'
  | 'highContrast'
  | 'focus'

/**
 * The keys checked to decide whether a preset counts as "active".
 * If the user later changes only some of them, it's still considered active
 * as long as the remaining keys still match.
 */
export const PRESET_KEYS: Record<A11yPresetId, readonly (keyof A11ySettings)[]> = {
  lowVision: [
    'fontSize',
    'fontFamily',
    'lineHeight',
    'letterSpacing',
    'contrast',
    'smallTextBoostLevel',
    'bodyTextExpandLevel',
    'linkUnderline',
    'focusEnhance',
  ],
  colorVision: ['saturation', 'contrast', 'linkUnderline', 'theme'],
  mild: ['theme', 'saturation', 'reduceMotion'],
  senior: ['bodyTextExpandLevel', 'contrast', 'linkUnderline'],
  highContrast: ['theme', 'contrast'],
  focus: ['lineHeight', 'saturation'],
}

export const A11Y_PRESETS: Record<A11yPresetId, Partial<A11ySettings>> = {
  /** Low vision: bigger, roomier, crisper. Avoids double-applying with body-text expand. */
  lowVision: {
    fontSize: 'xlarge',
    fontFamily: 'ud',
    lineHeight: 'wide',
    letterSpacing: 'wide',
    contrast: 'strong',
    smallTextBoostLevel: 2,
    bodyTextExpandLevel: 0,
    linkUnderline: true,
    focusEnhance: true,
  },
  /** Color-vision support: lean on cues that don't depend on color. */
  colorVision: {
    theme: 'standard',
    saturation: 'mono',
    contrast: 'strong',
    linkUnderline: true,
  },
  /**
   * Mild (low sensory stimulation): cream background + dark gray text, 50%
   * saturation, animations stopped. theme=soft is #F5F2EB / #2B2B2B,
   * saturation=soft is 0.5.
   */
  mild: {
    theme: 'soft',
    saturation: 'soft',
    reduceMotion: true,
  },
  /** Crisp (senior): body text at 1.25× (level 2) + 140% contrast + underlined links. */
  senior: {
    bodyTextExpandLevel: 2,
    contrast: 'strong',
    linkUnderline: true,
  },
  /** High-contrast black: black background, yellow text, max contrast. */
  highContrast: {
    theme: 'high-contrast',
    contrast: 'max',
  },
  /** Simple (focus): 2.0 line height + monochrome. */
  focus: {
    lineHeight: 'wide',
    saturation: 'mono',
  },
}

export const A11Y_PRESET_IDS: A11yPresetId[] = [
  'lowVision',
  'colorVision',
  'mild',
  'senior',
  'highContrast',
  'focus',
]

/** Collects every key touched by any preset (groundwork for exclusive application). */
function allPresetKeys(): (keyof A11ySettings)[] {
  const keys = new Set<keyof A11ySettings>()
  for (const id of A11Y_PRESET_IDS) {
    for (const key of PRESET_KEYS[id]) keys.add(key)
  }
  return [...keys]
}

/** Whether every key a preset specifies matches the current settings. */
export function isPresetActive(id: A11yPresetId): boolean {
  const preset = A11Y_PRESETS[id]
  return PRESET_KEYS[id].every((key) => a11ySettings[key] === preset[key])
}

/**
 * Applies a preset. Fields touched by other presets are first reset to the
 * defaults, then overwritten, so the result never conflicts with the panel's
 * theme / saturation / contrast selection state.
 */
export function applyA11yPreset(id: A11yPresetId) {
  const patch: Partial<A11ySettings> = {}
  for (const key of allPresetKeys()) {
    ;(patch as Record<string, unknown>)[key] = A11Y_DEFAULTS[key]
  }
  Object.assign(patch, A11Y_PRESETS[id])
  patchA11ySettings(patch)
  // Low-vision and senior tend to break when stacked with auto-adjustment, so turn it off.
  if (id === 'lowVision' || id === 'senior') runAutoTextAction('reset')
}

/**
 * Resets the fields a preset touched back to the defaults.
 * If another preset is currently active and needs the same field, that
 * preset's value is kept instead.
 */
export function clearA11yPreset(id: A11yPresetId) {
  const patch: Partial<A11ySettings> = {}
  for (const key of PRESET_KEYS[id]) {
    const keptByOther = A11Y_PRESET_IDS.some(
      (other) =>
        other !== id &&
        isPresetActive(other) &&
        (PRESET_KEYS[other] as readonly (keyof A11ySettings)[]).includes(key) &&
        A11Y_PRESETS[other][key] === a11ySettings[key],
    )
    if (!keptByOther) {
      ;(patch as Record<string, unknown>)[key] = A11Y_DEFAULTS[key]
    }
  }
  patchA11ySettings(patch)
}

/** Off if currently active, on otherwise. Returns the state after the operation. */
export function toggleA11yPreset(id: A11yPresetId): 'on' | 'off' {
  if (isPresetActive(id)) {
    clearA11yPreset(id)
    return 'off'
  }
  applyA11yPreset(id)
  return 'on'
}
