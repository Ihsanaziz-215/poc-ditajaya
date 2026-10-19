import { describe, expect, test } from 'vitest'
import { hasFollowUp, today } from '../derived'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { recordFollowUp } from './sales'

describe('recordFollowUp', () => {
  test('only Sales', () => {
    const db = freshDb()
    expect(() => recordFollowUp(db, as(db, 'Purchasing'), 'c2')).toThrow(DomainError)
  })
  test('adds an activity dated today, clears the notification, and flips hasFollowUp', () => {
    const db = freshDb()
    const c2 = db.customers.find((c) => c.id === 'c2')!
    expect(hasFollowUp(c2, today(db))).toBe(false)
    expect(db.notifs.some((n) => n.cid === 'c2')).toBe(true)
    recordFollowUp(db, as(db, 'Sales'), 'c2')
    expect(c2.acts.at(-1)).toEqual({ date: '2026-10-15', what: 'Follow up (demo)' })
    expect(db.notifs.some((n) => n.cid === 'c2')).toBe(false)
    expect(hasFollowUp(c2, today(db))).toBe(true)
  })
  test('already followed up customer still succeeds without touching other notifications', () => {
    const db = freshDb()
    const n = db.notifs.length
    recordFollowUp(db, as(db, 'Sales'), 'c1')
    expect(db.notifs).toHaveLength(n)
    expect(() => recordFollowUp(db, as(db, 'Sales'), 'nope')).toThrow(DomainError)
  })
})
