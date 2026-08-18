/**
 * UniLens settings store — per-feature toggles, persisted in localStorage.
 * Feature code reads settings.<flag> live, so toggles apply immediately
 * without re-init. UI lives in SettingsPanel.tsx.
 */

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

const STORAGE_KEY = 'unilens-settings'

export const settings: Settings = { ...DEFAULTS }
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
} catch {
  /* corrupted storage — keep defaults */
}

const listeners: (() => void)[] = []

/** subscribe to settings changes (returns unsubscribe) — lets open UI re-render live */
export function onSettingsChange(cb: () => void): () => void {
  listeners.push(cb)
  return () => listeners.splice(listeners.indexOf(cb), 1)
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* private browsing / blocked storage — settings still apply for this page load */
  }
  listeners.forEach((cb) => cb())
}

/** programmatic settings change (e.g. keyboard shortcuts) — persists + notifies */
export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  settings[key] = value
  save()
}
