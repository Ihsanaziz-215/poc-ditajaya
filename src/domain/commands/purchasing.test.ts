import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { markAllBought, resolveFollowUp, saveSupplier, sendToSales, setProc, setProcInfo, toggleSupplier } from './purchasing'
import { editItem } from './shared'

describe('sendToSales', () => {
  test('only Purchasing', () => {
    const db = freshDb()
    for (const r of ['Sales', 'Teknisi', 'Gudang'] as const) expect(() => sendToSales(db, as(db, r), db.forms[0].id)).toThrow(DomainError)
  })
  test('lists every item missing price or supplier', () => {
    const db = freshDb()
    try {
      sendToSales(db, as(db, 'Purchasing'), db.forms[0].id)
      expect.unreachable()
    } catch (e) {
      const err = e as DomainError
      expect(err.message).toBe('Harga dan supplier wajib terisi untuk semua barang.')
      expect(Object.keys(err.fields!)).toHaveLength(8)
      expect(Object.keys(err.fields!).every((k) => k.startsWith('item:'))).toBe(true)
    }
    expect(db.forms[0].status).toBe('Diajukan')
  })
  test('succeeds once priced, notifies Sales, and a second call is rejected', () => {
    const db = freshDb()
    const f = db.forms[0]
    const ctx = as(db, 'Purchasing')
    f.items.forEach((i) => { editItem(db, ctx, f.id, i.id, 'price', 1000); editItem(db, ctx, f.id, i.id, 'supplier', 'CV Bearing Prima') })
    sendToSales(db, ctx, f.id)
    expect(f.status).toBe('Harga Terisi')
    expect(f.log.at(-1)).toMatchObject({ act: 'Ubah status pengajuan', o: 'Diajukan', n: 'Harga Terisi' })
    expect(db.notifs[0]).toMatchObject({ roles: ['Sales'], text: `Harga Terisi: ${f.id} ${f.cust}` })
    expect(() => sendToSales(db, ctx, f.id)).toThrow(DomainError)
  })
})

describe('procurement', () => {
  test('setProc rejects unapproved forms and items awaiting follow up', () => {
    const db = freshDb()
    const ctx = as(db, 'Purchasing')
    expect(() => setProc(db, ctx, db.forms[0].id, db.forms[0].items[0].id, 'Dibeli')).toThrow(DomainError)
    const f3 = db.forms[2]
    expect(() => setProc(db, ctx, f3.id, f3.items[0].id, 'Dibeli')).toThrow(DomainError)
    expect(() => setProc(db, as(db, 'Sales'), f3.id, f3.items[1].id, 'Indent')).toThrow(DomainError)
  })
  test('setProc logs and notifies Teknisi when everything becomes ready', () => {
    const db = freshDb()
    const ctx = as(db, 'Purchasing')
    const f4 = db.forms[3]
    f4.items[1].good = 0
    f4.items[1].proc = null
    setProc(db, ctx, f4.id, f4.items[1].id, 'In Stock')
    expect(f4.log.at(-1)).toMatchObject({ act: 'Ubah status pengadaan — Seal kit', o: 'Belum Diproses', n: 'In Stock' })
    expect(db.notifs[0]).toMatchObject({ roles: ['Teknisi'], text: 'Barang siap: BD-2610-004 bisa dikonfirmasi' })
  })
  test('setProcInfo logs eta and note changes', () => {
    const db = freshDb()
    const f3 = db.forms[2]
    setProcInfo(db, as(db, 'Purchasing'), f3.id, f3.items[1].id, 'eta', '2026-10-30')
    expect(f3.items[1].eta).toBe('2026-10-30')
    expect(f3.log.at(-1)).toMatchObject({ act: 'Ubah Estimasi Tiba — Oil filter element', o: '—', n: '2026-10-30' })
  })
  test('resolveFollowUp returns the item to Dibeli', () => {
    const db = freshDb()
    const f3 = db.forms[2]
    const b = f3.items[0]
    resolveFollowUp(db, as(db, 'Purchasing'), f3.id, b.id)
    expect(b.proc).toBe('Dibeli')
    expect(b.bad).toBe(0)
    expect(f3.log.at(-1)).toMatchObject({
      act: 'Follow up retur selesai — Bearing 6309 ZZ ×2 dikembalikan ke CV Sumber Teknik Udara', o: 'Perlu Follow Up', n: 'Dibeli',
    })
    expect(() => resolveFollowUp(db, as(db, 'Purchasing'), f3.id, b.id)).toThrow(DomainError)
  })
  test('markAllBought marks only active unprocessed items and reports the count', () => {
    const db = freshDb()
    const f3 = db.forms[2]
    f3.items[1].proc = null
    f3.items[2].proc = null
    const r = markAllBought(db, as(db, 'Purchasing'), f3.id)
    expect(r).toMatchObject({ message: '2 barang ditandai Dibeli' })
    expect(f3.items[4].proc).toBeNull()
    expect(markAllBought(db, as(db, 'Purchasing'), f3.id)).toMatchObject({ message: 'Semua barang sudah punya status pengadaan' })
  })
})

describe('suppliers', () => {
  test('saveSupplier validates, edits and adds', () => {
    const db = freshDb()
    const ctx = as(db, 'Purchasing')
    expect(() => saveSupplier(db, ctx, { name: ' ', contact: '', cats: [], active: true })).toThrow('Nama supplier wajib diisi.')
    saveSupplier(db, ctx, { id: 's1', name: 'CV Baru', contact: 'x', cats: ['A'], active: false })
    expect(db.suppliers.find((s) => s.id === 's1')).toMatchObject({ name: 'CV Baru', active: false })
    saveSupplier(db, ctx, { id: 's1', name: 'CV Baru', contact: '0812', pic: ' Pak Wawan ', cats: ['A'], active: false })
    expect(db.suppliers.find((s) => s.id === 's1')).toMatchObject({ contact: '0812', pic: 'Pak Wawan' })
    saveSupplier(db, ctx, { name: 'Supplier Z', contact: '', cats: [], active: true })
    expect(db.suppliers[0].name).toBe('Supplier Z')
    expect(db.suppliers).toHaveLength(7)
  })
  test('only Purchasing manages suppliers', () => {
    const db = freshDb()
    expect(() => toggleSupplier(db, as(db, 'Sales'), 's1')).toThrow(DomainError)
    toggleSupplier(db, as(db, 'Purchasing'), 's1')
    expect(db.suppliers[0].active).toBe(false)
  })
})
