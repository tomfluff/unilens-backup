/**
 * UniLens settings store (zustand) — per-feature toggles, persisted in localStorage.
 * React reads via the useSettings hook; imperative modules via getSettings().
 * UI lives in SettingsPanel.tsx.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Settings {
  zoom: boolean
  mouseTrace: boolean
  zoomTrace: boolean
  viewportCrop: boolean
  zoomKeys: boolean
  smoothZoom: boolean
  smartZoom: boolean
  streamReplies: boolean
  quickActions: boolean
  dragPopover: boolean
  elementContext: boolean
  regionSelect: boolean
  highContrast: boolean
  continuity: boolean
  autoRead: boolean
  voiceInput: boolean
  hints: boolean
  minimap: boolean
  /** freeze the page and pan by transform while zoomed, instead of scrolling it */
  lensPan: boolean
  debugView: boolean
  /** capture render scale: 1 = screen resolution, 0.5 = reduced */
  captureRes: number
  /** chat bubble font size in px */
  chatFontSize: number
}

const DEFAULTS: Settings = {
  zoom: true,
  mouseTrace: true,
  zoomTrace: true,
  viewportCrop: true,
  zoomKeys: true,
  smoothZoom: true,
  smartZoom: true,
  streamReplies: true,
  quickActions: true,
  dragPopover: true,
  elementContext: true,
  regionSelect: true,
  highContrast: false,
  continuity: true,
  autoRead: false,
  voiceInput: true,
  hints: true,
  minimap: true,
  lensPan: false,
  debugView: false,
  captureRes: 1,
  chatFontSize: 14,
}

/** keys of Settings whose value is a boolean — the on/off rows in the panel */
export type BoolSettingKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings]

export const TOGGLE_LABELS: Record<BoolSettingKey, string> = {
  zoom: 'Page zoom (ctrl+wheel)',
  mouseTrace: 'Mouse trail capture',
  zoomTrace: 'Zoom history capture',
  viewportCrop: 'Send zoomed-view close-up',
  zoomKeys: 'Zoom shortcuts (ctrl +/− /0)',
  smoothZoom: 'Smooth zoom animation',
  smartZoom: 'Double-click zoom to fit',
  streamReplies: 'Streaming chat replies',
  quickActions: 'Quick-action chips',
  dragPopover: 'Movable popover (drag header)',
  elementContext: 'Clicked-element context capture',
  regionSelect: 'Alt+drag region select',
  highContrast: 'High-contrast chat',
  continuity: 'Conversation continuity',
  autoRead: 'Read replies aloud',
  voiceInput: 'Voice input (mic)',
  hints: 'Proactive help hints',
  minimap: 'Minimap while zoomed',
  lensPan: 'Lens panning (freeze page while zoomed)',
  debugView: 'Debug view (ctrl+shift+D)',
}

// One-time lift of pre-zustand flat JSON into persist's { state, version } envelope,
// so saved settings survive the store migration. Only a plain object without a
// `state` member is lifted — anything else (array, string, number, a colliding
// writer's data) is left untouched and persist falls back to defaults.
try {
  const raw = localStorage.getItem('unilens-settings')
  if (raw) {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      !('state' in parsed)
    ) {
      localStorage.setItem('unilens-settings', JSON.stringify({ state: parsed, version: 0 }))
    }
  }
} catch {
  /* corrupted or blocked storage — defaults apply */
}

export const useSettings = create<Settings>()(persist(() => ({ ...DEFAULTS }), { name: 'unilens-settings' }))

/** live snapshot for non-React modules (React components use the useSettings hook) */
export const getSettings = () => useSettings.getState()

/** subscribe to settings changes (returns unsubscribe) — lets open UI re-render live */
export const onSettingsChange = (cb: () => void) => useSettings.subscribe(cb)

/** programmatic settings change (e.g. keyboard shortcuts) — persists + notifies */
export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  useSettings.setState({ [key]: value })
}
