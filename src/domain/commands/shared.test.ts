import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { addComment, addItem, deleteItem, editItem, markAllNotifsRead, markNotifRead } from './shared'
import { createForm } from './teknisi'

describe('editItem', () => {
  test('Purchasing cannot edit name or qty; Gudang cannot edit anything', () => {
    const db = freshDb()
    const f = db.forms[0]
    const i = f.items[0]
    expect(() => editItem(db, as(db, 'Purchasing'), f.id, i.id, 'name', 'x')).toThrow(DomainError)
    expect(() => editItem(db, as(db, 'Purchasing'), f.id, i.id, 'qty', 5)).toThrow(DomainError)
    expect(() => editItem(db, as(db, 'Gudang'), f.id, i.id, 'price', 5)).toThrow(DomainError)
    expect(() => editItem(db, as(db, 'Sales'), f.id, i.id, 'price', 5)).toThrow(DomainError)
  })
  test('Purchasing prices and picks supplier on Diajukan, with formatted log', () => {
    const db = freshDb()
    const f = db.forms[0]
    const i = f.items[0]
    editItem(db, as(db, 'Purchasing'), f.id, i.id, 'price', 1500000)
    editItem(db, as(db, 'Purchasing'), f.id, i.id, 'supplier', 'CV Bearing Prima')
    expect(i.price).toBe(1500000)
    expect(f.log.at(-2)).toMatchObject({ act: `Ubah Harga — ${i.name}`, o: '—', n: '1.500.000' })
    expect(f.log.at(-1)).toMatchObject({ act: `Ubah Supplier — ${i.name}`, o: '—', n: 'CV Bearing Prima' })
  })
  test('invalid values are rejected with the prototype messages', () => {
    const db = freshDb()
    const f = db.forms[1]
    const i = f.items[0]
    expect(() => editItem(db, as(db, 'Sales'), f.id, i.id, 'qty', 0)).toThrow('Qty minimal 1.')
    expect(() => editItem(db, as(db, 'Sales'), f.id, i.id, 'qty', 1.5)).toThrow('Qty minimal 1.')
    expect(() => editItem(db, as(db, 'Sales'), f.id, i.id, 'price', -1)).toThrow('Harga tidak valid.')
    expect(() => editItem(db, as(db, 'Sales'), f.id, i.id, 'name', '  ')).toThrow('Nama barang tidak boleh kosong.')
  })
  test('same value is a no-op without a log entry', () => {
    const db = freshDb()
    const f = db.forms[1]
    const n = f.log.length
    editItem(db, as(db, 'Sales'), f.id, f.items[0].id, 'qty', f.items[0].qty)
    expect(f.log).toHaveLength(n)
  })
  test('Sales edit after the quote was sent creates v2 and leaves v1 untouched', () => {
    const db = freshDb()
    const f = db.forms[2]
    f.status = 'Harga Terisi'
    const q = db.quotes[0]
    const item = f.items[1]
    editItem(db, as(db, 'Sales'), f.id, item.id, 'qty', 3)
    expect(q.versions).toHaveLength(2)
    expect(q.versions[0].items.find((x) => x.iid === item.id)!.qty).toBe(2)
    expect(q.versions[1].items.find((x) => x.iid === item.id)!.qty).toBe(3)
    expect(q.versions[1].status).toBe('Belum Dikirim')
    expect(f.log.some((l) => l.act === 'Buat Quotation v2 (revisi harga atau qty setelah terkirim)')).toBe(true)
  })
})

describe('addItem / deleteItem', () => {
  test('addItem needs canStruct and logs', () => {
    const db = freshDb()
    const f = db.forms[1]
    expect(() => addItem(db, as(db, 'Purchasing'), f.id, { name: 'X', qty: 1 })).toThrow(DomainError)
    addItem(db, as(db, 'Sales'), f.id, { name: 'Baut', qty: 4 })
    expect(f.items.at(-1)).toMatchObject({ name: 'Baut', qty: 4 })
    expect(f.log.at(-1)).toMatchObject({ act: 'Tambah barang', o: '—', n: 'Baut × 4' })
    expect(() => addItem(db, as(db, 'Sales'), f.id, { name: '', qty: 1 })).toThrow('Isi nama barang dan qty minimal 1.')
  })
  test('deleteItem is Teknisi on Draft only and keeps at least one item', () => {
    const db = freshDb()
    createForm(db, as(db, 'Teknisi'), { cust: 'PT ABC', date: '2026-10-15', analysis: '', note: '', items: [{ name: 'A', qty: 1 }, { name: 'B', qty: 1 }], submit: false })
    const f = db.forms[0]
    expect(() => deleteItem(db, as(db, 'Sales'), f.id, f.items[0].id)).toThrow(DomainError)
    deleteItem(db, as(db, 'Teknisi'), f.id, f.items[0].id)
    expect(f.items).toHaveLength(1)
    expect(() => deleteItem(db, as(db, 'Teknisi'), f.id, f.items[0].id)).toThrow('Form harus punya minimal satu barang.')
  })
})

describe('comments and notifications', () => {
  test('addComment notifies the other three roles and does not log', () => {
    const db = freshDb()
    const f = db.forms[0]
    const n = f.log.length
    addComment(db, as(db, 'Gudang'), f.id, ' halo ')
    expect(f.comments.at(-1)).toMatchObject({ role: 'Gudang', user: 'Joko', text: 'halo' })
    expect(db.notifs[0].roles).toEqual(['Teknisi', 'Purchasing', 'Sales'])
    expect(f.log).toHaveLength(n)
    expect(() => addComment(db, as(db, 'Gudang'), f.id, '   ')).toThrow(DomainError)
  })
  test('mark read per role', () => {
    const db = freshDb()
    const sales = db.notifs.filter((n) => n.roles.includes('Sales'))
    markNotifRead(db, as(db, 'Sales'), sales[0].id)
    expect(sales[0].read.Sales).toBe(true)
    markAllNotifsRead(db, as(db, 'Sales'))
    expect(db.notifs.filter((n) => n.roles.includes('Sales')).every((n) => n.read.Sales)).toBe(true)
    expect(db.notifs.filter((n) => n.roles.includes('Purchasing')).every((n) => !n.read.Sales)).toBe(true)
  })
})
