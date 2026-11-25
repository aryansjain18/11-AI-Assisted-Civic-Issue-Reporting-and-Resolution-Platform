import { describe, it, expect } from 'vitest'
import { CATEGORIES, STATUSES, PRIORITIES } from '../types'

describe('Domain types', () => {
  it('CATEGORIES contains the expected values', () => {
    const values = CATEGORIES.map((c) => c.value)
    expect(values).toContain('pothole')
    expect(values).toContain('garbage')
    expect(values).toContain('water_leak')
    expect(values).toContain('streetlight')
    expect(values).toContain('drainage')
    expect(values).toContain('other')
    expect(values).toHaveLength(6)
  })

  it('STATUSES contains the expected values', () => {
    const values = STATUSES.map((s) => s.value)
    expect(values).toContain('submitted')
    expect(values).toContain('under_review')
    expect(values).toContain('in_progress')
    expect(values).toContain('resolved')
    expect(values).toContain('rejected')
    expect(values).toHaveLength(5)
  })

  it('PRIORITIES contains low, medium, high', () => {
    const values = PRIORITIES.map((p) => p.value)
    expect(values).toContain('low')
    expect(values).toContain('medium')
    expect(values).toContain('high')
    expect(values).toHaveLength(3)
  })

  it('every CATEGORY has a non-empty label', () => {
    CATEGORIES.forEach((cat) => {
      expect(cat.label.trim()).not.toBe('')
    })
  })

  it('every STATUS has a non-empty label', () => {
    STATUSES.forEach((status) => {
      expect(status.label.trim()).not.toBe('')
    })
  })
})
