import { expect, test } from 'vitest'
import { resolveFollowUp, sendToSales, setProc } from './commands/purchasing'
import { receive } from './commands/gudang'
import { decide, makeQuote, reviseForm } from './commands/sales'
import { editItem } from './commands/shared'
import { confirmItems, createForm, finishWork } from './commands/teknisi'
import { statusOf } from './derived'
import { FLOW, rankOf } from './flow'
import { as, freshDb } from './testing'

test('a new form only moves forward; the only way back is a PRD exception loop', () => {
  const db = freshDb()
  const seen: string[] = []
  const f0 = () => db.forms[0]
  const step = (fn: () => unknown) => { fn(); seen.push(statusOf(f0())) }
  const T = as(db, 'Teknisi'), P = as(db, 'Purchasing'), S = as(db, 'Sales'), G = as(db, 'Gudang')

  step(() => createForm(db, T, { cust: 'PT ABC', date: '2026-10-15', analysis: '', note: '', submit: true, items: [{ name: 'A', qty: 2 }, { name: 'B', qty: 1 }] }))
  const f = f0()
  const [a, b] = f.items
  f.items.forEach((i) => { editItem(db, P, f.id, i.id, 'price', 100); editItem(db, P, f.id, i.id, 'supplier', 'X') })
  step(() => sendToSales(db, P, f.id))
  step(() => makeQuote(db, S, f.id))
  step(() => decide(db, S, f.id, 'Disetujui'))
  step(() => setProc(db, P, f.id, a.id, 'Indent'))
  step(() => setProc(db, P, f.id, b.id, 'Dibeli'))
  // no flipping back and forth while procurement is open
  expect(() => setProc(db, P, f.id, b.id, 'In Stock')).toThrow('tidak bisa mundur')
  expect(() => setProc(db, P, f.id, b.id, 'Indent')).toThrow('tidak bisa mundur')
  step(() => setProc(db, P, f.id, a.id, 'Dibeli'))
  step(() => receive(db, G, f.id, b.id, { date: '2026-10-16', qty: 1, cond: 'Baik', note: '' }))
  expect(() => setProc(db, P, f.id, b.id, 'Indent')).toThrow('terkunci')
  step(() => receive(db, G, f.id, a.id, { date: '2026-10-16', qty: 1, cond: 'Rusak', note: '' }))
  expect(statusOf(f)).toBe('Perlu Follow Up')
  step(() => resolveFollowUp(db, P, f.id, a.id))
  step(() => receive(db, G, f.id, a.id, { date: '2026-10-17', qty: 2, cond: 'Baik', note: '' }))
  step(() => confirmItems(db, T, f.id, 'Sesuai', ''))
  step(() => finishWork(db, T, f.id))

  const ranks = seen.map(rankOf).filter((r): r is number => r !== null)
  expect(ranks).toEqual([...ranks].sort((x, y) => x - y))
  expect(seen.at(-1)).toBe('Selesai')
  expect(seen).toContain('Perlu Follow Up')
})

test('Gudang waits until Purchasing has checked every item', () => {
  const db = freshDb()
  const f = db.forms[2]
  f.items[1].proc = null
  expect(() => receive(db, as(db, 'Gudang'), f.id, f.items[2].id, { date: '2026-10-17', qty: 1, cond: 'Baik', note: '' })).toThrow('Menunggu Purchasing')
})

test('Tidak Sesuai loops back to Sales and then forward again', () => {
  const db = freshDb()
  const f = db.forms[3]
  confirmItems(db, as(db, 'Teknisi'), f.id, 'Tidak Sesuai', 'salah ukuran')
  expect(statusOf(f)).toBe('Tidak Sesuai')
  reviseForm(db, as(db, 'Sales'), f.id)
  expect(statusOf(f)).toBe('Harga Terisi')
})

test('every FLOW exit points at a known status', () => {
  const names = new Set(FLOW.map((s) => s.status))
  for (const s of FLOW) for (const n of s.next) expect(names.has(n.to)).toBe(true)
})
