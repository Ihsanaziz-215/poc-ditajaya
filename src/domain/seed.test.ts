import { describe, expect, test } from 'vitest'
import { buildSeed } from './seed'

describe('buildSeed', () => {
  const db = buildSeed(1_000)
  test('has the prototype dataset sizes', () => {
    expect(db.forms).toHaveLength(6)
    expect(db.quotes).toHaveLength(5)
    expect(db.suppliers).toHaveLength(6)
    expect(db.customers).toHaveLength(8)
    expect(db.notifs).toHaveLength(8)
  })
  test('sequences continue after the seeded data', () => {
    expect(db.seq.quote).toBe(3003)
    expect(db.seq.form).toBe(6)
  })
  test('form ids and terminal states', () => {
    expect(db.forms.map((f) => f.id)).toEqual([
      'BD-2610-001', 'BD-2610-002', 'BD-2610-003', 'BD-2610-004', 'BD-2609-005', 'BD-2610-006',
    ])
    expect(db.forms.filter((f) => f.done).map((f) => f.id)).toEqual(['BD-2609-005'])
    expect(db.forms[5].status).toBe('Batal')
  })
  test('quotes are attached to forms 3, 4, 5 plus two legacy', () => {
    expect(db.quotes.map((q) => [q.id, q.formId])).toEqual([
      ['Q3001', 'BD-2610-003'], ['Q3002', 'BD-2610-004'], ['Q3003', 'BD-2609-005'], ['QL1', null], ['QL2', null],
    ])
    expect(db.quotes[0].number).toBe('DMP/U/2026/X/QT3001')
  })
  test('is deterministic', () => {
    expect(buildSeed(1_000)).toEqual(db)
  })
  test('clock starts at 15 Oct 2026 16:10 simulated', () => {
    expect(db.clock.sim).toBe(new Date(2026, 9, 15, 16, 10).getTime())
    expect(db.clock.real).toBe(1_000)
  })
})
