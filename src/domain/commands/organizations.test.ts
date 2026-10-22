import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { createOrganization, deleteOrganization, editOrganization, importOrganizations } from './organizations'

const input = { name: 'PT Jati Karya', addr: 'Jalan Baru', country: 'Indonesia', city: 'jakarta', province: 'jakarta', postal: '12260', owner: 'Sales', pic: 'Budi', email: 'budi@jati.co.id', phone: '021-555' }

describe('editOrganization', () => {
  test('only Sales can edit', () => {
    const db = freshDb()
    for (const r of ['Teknisi', 'Purchasing', 'Gudang'] as const) expect(() => editOrganization(db, as(db, r), 'c3', input)).toThrow(DomainError)
  })
  test('saves trimmed fields and keeps the computed labels untouched', () => {
    const db = freshDb()
    const before = structuredClone(db.customers.find((c) => c.id === 'c3')!.purchases)
    editOrganization(db, as(db, 'Sales'), 'c3', { ...input, city: ' Bogor ', postal: ' 16110 ', owner: '' })
    const c = db.customers.find((x) => x.id === 'c3')!
    expect(c).toMatchObject({ city: 'Bogor', postal: '16110', owner: '' })
    expect(c.purchases).toEqual(before)
  })
  test('name is required and must be unique', () => {
    const db = freshDb()
    expect(() => editOrganization(db, as(db, 'Sales'), 'c3', { ...input, name: ' ' })).toThrow('Name wajib diisi.')
    expect(() => editOrganization(db, as(db, 'Sales'), 'c3', { ...input, name: 'pt abc' })).toThrow('Nama organization sudah dipakai.')
    expect(() => editOrganization(db, as(db, 'Sales'), 'nope', input)).toThrow(DomainError)
  })
  test('renaming carries over to the forms of that customer', () => {
    const db = freshDb()
    const n = db.forms.filter((f) => f.cust === 'PT Jati Karya').length
    expect(n).toBeGreaterThan(0)
    editOrganization(db, as(db, 'Sales'), 'c3', { ...input, name: 'PT Jati Karya Baru' })
    expect(db.forms.filter((f) => f.cust === 'PT Jati Karya Baru')).toHaveLength(n)
    expect(db.forms.some((f) => f.cust === 'PT Jati Karya')).toBe(false)
  })
})

describe('deleteOrganization', () => {
  test('only Sales can delete', () => {
    const db = freshDb()
    for (const r of ['Teknisi', 'Purchasing', 'Gudang'] as const) expect(() => deleteOrganization(db, as(db, r), 'c7')).toThrow(DomainError)
  })
  test('refused while forms reference the customer', () => {
    const db = freshDb()
    expect(() => deleteOrganization(db, as(db, 'Sales'), 'c3')).toThrow('masih punya')
    expect(db.customers.some((c) => c.id === 'c3')).toBe(true)
  })
  test('deletes a customer without forms, together with its follow-up notification', () => {
    const db = freshDb()
    expect(db.notifs.some((n) => n.cid === 'c7')).toBe(true)
    deleteOrganization(db, as(db, 'Sales'), 'c7')
    expect(db.customers.some((c) => c.id === 'c7')).toBe(false)
    expect(db.notifs.some((n) => n.cid === 'c7')).toBe(false)
    expect(() => deleteOrganization(db, as(db, 'Sales'), 'c7')).toThrow(DomainError)
  })
})

describe('createOrganization', () => {
  test('only Sales can create', () => {
    const db = freshDb()
    expect(() => createOrganization(db, as(db, 'Purchasing'), { ...input, name: 'PT Baru' })).toThrow(DomainError)
  })
  test('adds a new organization on top with the next ID, zero persons and no purchases', () => {
    const db = freshDb()
    const maxNo = Math.max(...db.customers.map((c) => c.no ?? 0))
    createOrganization(db, as(db, 'Sales'), { ...input, name: ' PT Baru ', owner: '' })
    const c = db.customers[0]
    expect(c).toMatchObject({ name: 'PT Baru', no: maxNo + 1, persons: 0, purchases: [], acts: [] })
    expect(new Set(db.customers.map((x) => x.id)).size).toBe(db.customers.length)
  })
  test('name is required and must be unique', () => {
    const db = freshDb()
    expect(() => createOrganization(db, as(db, 'Sales'), { ...input, name: '' })).toThrow('Name wajib diisi.')
    expect(() => createOrganization(db, as(db, 'Sales'), { ...input, name: 'PT ABC' })).toThrow('Nama organization sudah dipakai.')
  })
})

describe('importOrganizations', () => {
  test('creates valid rows, skips duplicates (also inside the file) and blank names', () => {
    const db = freshDb()
    const n = db.customers.length
    const r = importOrganizations(db, as(db, 'Sales'), [
      { ...input, name: 'PT Import Satu' }, { ...input, name: 'pt import satu' }, { ...input, name: 'PT ABC' }, { ...input, name: ' ' }, { ...input, name: 'PT Import Dua' },
    ])
    expect(db.customers).toHaveLength(n + 2)
    expect(r && r.message).toBe('2 organization dibuat, 2 nama sudah ada, 1 baris tidak valid.')
  })
  test('refuses empty files, other roles and oversized imports', () => {
    const db = freshDb()
    expect(() => importOrganizations(db, as(db, 'Sales'), [])).toThrow('File tidak berisi baris data.')
    expect(() => importOrganizations(db, as(db, 'Gudang'), [input])).toThrow(DomainError)
    expect(() => importOrganizations(db, as(db, 'Sales'), Array.from({ length: 501 }, (_, i) => ({ ...input, name: `PT ${i}` })))).toThrow('Maksimal 500')
  })
})

describe('organization contact', () => {
  test('stores PIC, email and phone and rejects a bad email', () => {
    const db = freshDb()
    createOrganization(db, as(db, 'Sales'), { ...input, name: 'PT Kontak' })
    expect(db.customers[0]).toMatchObject({ pic: 'Budi', email: 'budi@jati.co.id', phone: '021-555' })
    expect(() => createOrganization(db, as(db, 'Sales'), { ...input, name: 'PT X', email: 'bukan-email' })).toThrow('Format email')
  })
})
