import { describe, expect, test } from 'vitest'
import { as, freshDb } from '../testing'
import { DomainError } from './core'
import { editOrganization } from './organizations'

const input = { name: 'PT Jati Karya', addr: 'Jalan Baru', country: 'Indonesia', city: 'jakarta', province: 'jakarta', postal: '12260', owner: 'Sales' }

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
