import { describe, expect, test } from 'vitest'
import { filterForms } from './listing'
import { freshDb } from './testing'

const forms = freshDb().forms
const ids = (r: typeof forms) => r.map((f) => f.id)

describe('filterForms', () => {
  test('no options returns everything', () => {
    expect(filterForms(forms, {}, 'Sales')).toHaveLength(6)
  })
  test('search matches id or customer, case-insensitive', () => {
    expect(ids(filterForms(forms, { q: 'dunia' }, 'Sales'))).toEqual(['BD-2610-002'])
    expect(filterForms(forms, { q: 'bd-2610-00' }, 'Sales')).toHaveLength(5)
  })
  test('status filter', () => {
    expect(ids(filterForms(forms, { status: 'Disetujui' }, 'Sales'))).toEqual(['BD-2610-003', 'BD-2610-004', 'BD-2609-005'])
  })
  test('mine keeps forms whose turn belongs to the viewer', () => {
    expect(ids(filterForms(forms, { mine: true }, 'Purchasing'))).toEqual(['BD-2610-001', 'BD-2610-003'])
    expect(ids(filterForms(forms, { mine: true }, 'Teknisi'))).toEqual(['BD-2610-004'])
  })
  test('combined filters with no match return an empty list', () => {
    expect(filterForms(forms, { q: 'dunia', status: 'Batal' }, 'Sales')).toEqual([])
  })
})
