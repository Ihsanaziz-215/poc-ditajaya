import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { receive } from './gudang'
import { setProcInfo } from './purchasing'
import { setQuoteDiscount, setQuoteField, setStrike } from './sales'
import { editItem } from './shared'

describe('I-4 field keys are whitelisted', () => {
  test('editItem rejects fields outside name/qty/price/supplier', () => {
    const db = freshDb()
    const f = db.forms[1]
    expect(() => editItem(db, as(db, 'Sales'), f.id, f.items[0].id, 'struck' as never, 'x')).toThrow(DomainError)
    expect(f.items[0].struck).toBe(false)
  })
  test('setProcInfo rejects keys other than eta/pnote', () => {
    const db = freshDb()
    const f = db.forms[2]
    expect(() => setProcInfo(db, as(db, 'Purchasing'), f.id, f.items[1].id, 'name' as never, 'x')).toThrow(DomainError)
    expect(f.items[1].name).toBe('Oil filter element')
  })
  test('setQuoteField rejects status/items and other non-editable keys', () => {
    const db = freshDb()
    for (const k of ['status', 'items', 'sentAt', 'ver']) {
      expect(() => setQuoteField(db, as(db, 'Sales'), 'QL1', k as never, 'x')).toThrow(DomainError)
    }
    expect(db.quotes[3].versions[0].status).toBe('Belum Dikirim')
  })
  test('receive rejects an unknown condition', () => {
    const db = freshDb()
    const f = db.forms[2]
    expect(() => receive(db, as(db, 'Gudang'), f.id, f.items[1].id, { date: '2026-10-15', qty: 1, cond: 'Hancur' as never, note: '' })).toThrow(DomainError)
    expect(f.items[1].bad).toBe(0)
  })
})

describe('I-2 strike is idempotent', () => {
  test('setStrike twice with the same target changes and logs once', () => {
    const db = freshDb()
    const f = db.forms[1]
    const n = f.log.length
    setStrike(db, as(db, 'Sales'), f.id, f.items[0].id, true)
    setStrike(db, as(db, 'Sales'), f.id, f.items[0].id, true)
    expect(f.items[0].struck).toBe(true)
    expect(f.log).toHaveLength(n + 1)
    setStrike(db, as(db, 'Sales'), f.id, f.items[0].id, false)
    expect(f.items[0].struck).toBe(false)
  })
})

describe('I-3 branching a sent quote is announced', () => {
  test('setQuoteField on a sent version returns a toast and redirects to the quote', () => {
    const db = freshDb()
    const r = setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'x')
    expect(r).toMatchObject({ kind: 'info', redirect: '/quotes/Q3001' })
    expect((r as { message: string }).message).toBe('Versi baru dibuat: Quotation v2. Versi lama tetap tersimpan.')
  })
  test('no toast when the latest version is not sent', () => {
    const db = freshDb()
    setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'x')
    expect(setQuoteField(db, as(db, 'Sales'), 'Q3001', 'termin', 'y')).toBeUndefined()
  })
  test('discount branch keeps the items tab', () => {
    const db = freshDb()
    const r = setQuoteDiscount(db, as(db, 'Sales'), 'Q3001', db.quotes[0].versions[0].items[0].iid, 10)
    expect(r).toMatchObject({ redirect: '/quotes/Q3001?tab=items' })
  })
  test('Sales editing the form after the quote was sent announces the new version', () => {
    const db = freshDb()
    const f = db.forms[2]
    f.status = 'Harga Terisi'
    const r = editItem(db, as(db, 'Sales'), f.id, f.items[1].id, 'qty', 3)
    expect(r).toMatchObject({ kind: 'info' })
    expect((r as { message: string }).message).toContain('Versi baru dibuat: Quotation v2')
  })
})
