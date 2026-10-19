import { describe, expect, test } from 'vitest'
import { canPrice, canStruct, canSup } from './permissions'
import type { Form } from './types'

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
})
