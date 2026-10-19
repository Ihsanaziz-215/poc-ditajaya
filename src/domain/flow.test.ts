import { expect, test } from 'vitest'
import { markAllBought, resolveFollowUp, sendToSales } from './commands/purchasing'
import { receive } from './commands/gudang'
import { decide, makeQuote, sendQuote } from './commands/sales'
import { editItem } from './commands/shared'
import { confirmItems, createForm, finishWork } from './commands/teknisi'
import { allGood } from './derived'
import { as, freshDb } from './testing'

test('a form travels from Teknisi to Selesai through all four roles', () => {
  const db = freshDb()
  const lens: number[] = []
  const step = (fn: () => unknown) => {
    fn()
    lens.push(db.forms[0].log.length)
  }

  step(() => createForm(db, as(db, 'Teknisi'), {
    cust: 'PT ABC', date: '2026-10-15', analysis: 'Seal bocor', note: '', submit: true,
    items: [{ name: 'Seal', qty: 2 }, { name: 'Baut', qty: 4 }],
  }))
  const f = db.forms[0]
  const [seal, baut] = f.items

  const P = as(db, 'Purchasing')
  f.items.forEach((i) => step(() => { editItem(db, P, f.id, i.id, 'price', 5000); editItem(db, P, f.id, i.id, 'supplier', 'CV Bearing Prima') }))
  step(() => sendToSales(db, P, f.id))

  const S = as(db, 'Sales')
  step(() => makeQuote(db, S, f.id))
  step(() => sendQuote(db, S, 'Q3004', { to: 'abc@x.com', cc: '', fail: false }))
  step(() => decide(db, S, f.id, 'Disetujui'))

  step(() => markAllBought(db, P, f.id))
  const G = as(db, 'Gudang')
  step(() => receive(db, G, f.id, seal.id, { date: '2026-10-16', qty: 1, cond: 'Rusak', note: '' }))
  step(() => receive(db, G, f.id, baut.id, { date: '2026-10-16', qty: 4, cond: 'Baik', note: '' }))
  expect(seal.proc).toBe('Perlu Follow Up')
  step(() => resolveFollowUp(db, P, f.id, seal.id))
  step(() => receive(db, G, f.id, seal.id, { date: '2026-10-17', qty: 2, cond: 'Baik', note: '' }))
  expect(allGood(f)).toBe(true)

  const T = as(db, 'Teknisi')
  step(() => confirmItems(db, T, f.id, 'Sesuai', ''))
  step(() => finishWork(db, T, f.id))

  expect(f.done).toBe(true)
  expect(f.log.filter((l) => l.act === 'Ubah status pengajuan').map((l) => `${l.o}>${l.n}`)).toEqual([
    'Draft>Diajukan', 'Diajukan>Harga Terisi', 'Harga Terisi>Disetujui',
  ])
  expect([...lens].sort((a, b) => a - b)).toEqual(lens)
  expect(f.log.some((l) => /comment/i.test(l.act))).toBe(false)

  const texts = db.notifs.map((n) => `${n.roles.join('+')}|${n.text}`)
  expect(texts).toContain(`Purchasing|Form Diajukan: ${f.id} PT ABC`)
  expect(texts).toContain(`Sales|Harga Terisi: ${f.id} PT ABC`)
  expect(texts).toContain(`Purchasing+Teknisi|Disetujui: ${f.id} PT ABC`)
  expect(texts).toContain('Purchasing|Barang Diterima Rusak: Seal ×1 (Supplier CV Bearing Prima)')
  expect(texts).toContain(`Teknisi|Barang Diterima Baik: ${f.id} siap dikonfirmasi`)
})
