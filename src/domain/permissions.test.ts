import { describe, expect, test } from 'vitest'
import { canPrice, canStruct, canSup, canSupItem } from './permissions'
import type { Form, Item } from './types'

const f = (status: Form['status']) => ({ status }) as Form

describe('permissions', () => {
  test('canStruct', () => {
    expect(canStruct(f('Draft'), 'Teknisi')).toBe(true)
    expect(canStruct(f('Harga Terisi'), 'Sales')).toBe(true)
    expect(canStruct(f('Diajukan'), 'Purchasing')).toBe(false)
    expect(canStruct(f('Disetujui'), 'Sales')).toBe(false)
  })
  test('canPrice', () => {
    expect(canPrice(f('Diajukan'), 'Purchasing')).toBe(true)
    expect(canPrice(f('Diajukan'), 'Sales')).toBe(false)
    expect(canPrice(f('Harga Terisi'), 'Sales')).toBe(true)
  })
  test('canSup', () => {
    expect(canSup(f('Diajukan'), 'Purchasing')).toBe(true)
    expect(canSup(f('Harga Terisi'), 'Purchasing')).toBe(false)
  })
  test('canSupItem: Purchasing mengisi atau mengganti supplier saat pengadaan', () => {
    const it = (o: Partial<Item> = {}) => ({ supplier: '', struck: false, good: 0, bad: 0, ...o }) as Item
    expect(canSupItem(f('Disetujui'), 'Purchasing', it())).toBe(true)
    expect(canSupItem(f('Disetujui'), 'Purchasing', it({ supplier: 'CV A' }))).toBe(true)
    expect(canSupItem(f('Disetujui'), 'Purchasing', it({ good: 1 }))).toBe(false)
    expect(canSupItem(f('Disetujui'), 'Purchasing', it({ struck: true }))).toBe(false)
    expect(canSupItem(f('Disetujui'), 'Sales', it())).toBe(false)
    expect(canSupItem(f('Harga Terisi'), 'Purchasing', it())).toBe(false)
  })
})
