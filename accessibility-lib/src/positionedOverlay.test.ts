import { describe, expect, it } from 'vitest'
import { hasNonZeroInset, isOpaqueBackgroundColor } from './documentEffects'

function style(inset: Partial<Record<'top' | 'right' | 'bottom' | 'left', string>>): CSSStyleDeclaration {
  return {
    top: inset.top ?? 'auto',
    right: inset.right ?? 'auto',
    bottom: inset.bottom ?? 'auto',
    left: inset.left ?? 'auto',
  } as CSSStyleDeclaration
}

describe('hasNonZeroInset', () => {
  it('ignores auto and zero offsets', () => {
    expect(hasNonZeroInset(style({}))).toBe(false)
    expect(hasNonZeroInset(style({ top: '0px' }))).toBe(false)
    expect(hasNonZeroInset(style({ top: 'auto', left: '0px' }))).toBe(false)
  })

  it('detects positive and negative offsets', () => {
    expect(hasNonZeroInset(style({ top: '12rem' }))).toBe(true)
    expect(hasNonZeroInset(style({ top: '-7rem' }))).toBe(true)
    expect(hasNonZeroInset(style({ left: '192px' }))).toBe(true)
  })
})

describe('isOpaqueBackgroundColor', () => {
  it('treats transparent / low-alpha as empty', () => {
    expect(isOpaqueBackgroundColor('transparent')).toBe(false)
    expect(isOpaqueBackgroundColor('rgba(0, 0, 0, 0)')).toBe(false)
    expect(isOpaqueBackgroundColor('rgba(51, 51, 51, 0)')).toBe(false)
    // SoftBank chevron end-cap — must not get a surface fill over the parent border
    expect(isOpaqueBackgroundColor('rgba(255, 255, 255, 0.25)')).toBe(false)
  })

  it('treats solid colors as opaque', () => {
    expect(isOpaqueBackgroundColor('rgb(51, 51, 51)')).toBe(true)
    expect(isOpaqueBackgroundColor('rgba(38, 38, 62, 1)')).toBe(true)
    expect(isOpaqueBackgroundColor('rgba(38, 38, 62, 0.95)')).toBe(true)
    expect(isOpaqueBackgroundColor('#333')).toBe(true)
  })
})
