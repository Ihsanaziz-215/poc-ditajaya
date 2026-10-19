import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { receive, receiveAll } from './gudang'

const ok = { date: '2026-10-15', qty: 2, cond: 'Baik' as const, note: '' }

describe('receive', () => {
  test('only Gudang', () => {
    const db = freshDb()
    const f = db.forms[2]
    expect(() => receive(db, as(db, 'Purchasing'), f.id, f.items[1].id, ok)).toThrow(DomainError)
  })
  test('good receipt adds to good and stock with the prototype log format', () => {
    const db = freshDb()
    const f = db.forms[2]
    const it = f.items[1]
    receive(db, as(db, 'Gudang'), f.id, it.id, ok)
    expect(it.good).toBe(2)
    expect(it.stock).toBe(2)
    expect(f.log.at(-1)).toMatchObject({
      act: 'Stock In Oil filter element ×2 — Baik (Supplier: PT Filtra Indo Perkasa)', o: '', n: '2 Baik', user: 'Joko',
    })
  })
  test('damaged receipt flips to Perlu Follow Up, logs the system change and notifies Purchasing', () => {
    const db = freshDb()
    const f = db.forms[2]
    const it = f.items[2]
    receive(db, as(db, 'Gudang'), f.id, it.id, { ...ok, qty: 1, cond: 'Rusak', note: 'penyok' })
    expect(it.bad).toBe(1)
    expect(it.proc).toBe('Perlu Follow Up')
    expect(f.log.at(-2)!.act).toBe('Stock In V-belt B52 ×1 — Rusak (Supplier: CV Sumber Teknik Udara) · penyok')
    expect(f.log.at(-1)).toMatchObject({ act: 'Ubah status pengadaan — V-belt B52', o: 'Indent', n: 'Perlu Follow Up', user: 'Sistem', role: '—' })
    expect(db.notifs[0]).toMatchObject({ roles: ['Purchasing'], text: 'Barang Diterima Rusak: V-belt B52 ×1 (Supplier CV Sumber Teknik Udara)' })
  })
  test('completing the last item notifies Teknisi', () => {
    const db = freshDb()
    const f = db.forms[3]
    f.items[1].good = 0
    receive(db, as(db, 'Gudang'), f.id, f.items[1].id, { ...ok, qty: 1 })
    expect(db.notifs[0]).toMatchObject({ roles: ['Teknisi'], text: 'Barang Diterima Baik: BD-2610-004 siap dikonfirmasi' })
  })
  test('invalid quantities and dates are rejected', () => {
    const db = freshDb()
    const f = db.forms[2]
    const id = f.items[1].id
    const g = as(db, 'Gudang')
    expect(() => receive(db, g, f.id, id, { ...ok, qty: 0 })).toThrow('Isi tanggal terima dan qty minimal 1.')
    expect(() => receive(db, g, f.id, id, { ...ok, qty: 1.5 })).toThrow('Isi tanggal terima dan qty minimal 1.')
    expect(() => receive(db, g, f.id, id, { ...ok, date: '' })).toThrow('Isi tanggal terima dan qty minimal 1.')
    expect(() => receive(db, g, f.id, id, { ...ok, qty: 99 })).toThrow('Qty melebihi sisa pesanan (2).')
    expect(f.items[1].good).toBe(0)
  })
  test('ineligible items are rejected with the reason', () => {
    const db = freshDb()
    const f = db.forms[2]
    const g = as(db, 'Gudang')
    expect(() => receive(db, g, f.id, f.items[3].id, ok)).toThrow('Barang dari stok')
    expect(() => receive(db, g, f.id, f.items[0].id, ok)).toThrow('Menunggu follow up Purchasing')
    f.items[1].proc = null
    expect(() => receive(db, g, f.id, f.items[1].id, ok)).toThrow('Menunggu Purchasing mengecek barang')
    expect(() => receive(db, g, db.forms[3].id, db.forms[3].items[0].id, { ...ok, qty: 1 })).toThrow('Sudah lengkap')
    expect(() => receive(db, g, db.forms[0].id, db.forms[0].items[0].id, ok)).toThrow(DomainError)
  })
})

describe('receiveAll', () => {
  test('receives the remainder of every Dibeli or Indent item', () => {
    const db = freshDb()
    const f = db.forms[2]
    const r = receiveAll(db, as(db, 'Gudang'), f.id)
    expect(r).toMatchObject({ message: '2 barang dicatat Diterima Baik' })
    expect(f.items[1].good).toBe(2)
    expect(f.items[2].good).toBe(3)
    expect(f.items[0].good).toBe(2)
    expect(f.items[1].stock).toBe(2)
  })
  test('nothing eligible is rejected', () => {
    const db = freshDb()
    expect(() => receiveAll(db, as(db, 'Gudang'), db.forms[3].id)).toThrow('Tidak ada barang yang siap diterima (harus berstatus Dibeli atau Indent).')
    expect(() => receiveAll(db, as(db, 'Sales'), db.forms[2].id)).toThrow(DomainError)
  })
})
