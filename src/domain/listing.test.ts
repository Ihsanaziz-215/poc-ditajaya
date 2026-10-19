import { describe, expect, test } from 'vitest'
import { filterForms } from './listing'
import { freshDb } from './testing'

const forms = freshDb().forms
const ids = (r: typeof forms) => r.map((f) => f.id)

describe('filterForms', () => {
  test('no options returns everything', () => {
    expect(filterForms(forms, {})).toHaveLength(6)
  })
  test('search matches id or customer, case-insensitive', () => {
    expect(ids(filterForms(forms, { q: 'dunia' }))).toEqual(['BD-2610-002'])
    expect(filterForms(forms, { q: 'bd-2610-00' })).toHaveLength(5)
  })
  test('status filter uses the single list status', () => {
    expect(ids(filterForms(forms, { status: 'Perlu Follow Up' }))).toEqual(['BD-2610-003'])
    expect(ids(filterForms(forms, { status: 'Diterima Baik' }))).toEqual(['BD-2610-004'])
    expect(ids(filterForms(forms, { status: 'Selesai' }))).toEqual(['BD-2609-005'])
    expect(filterForms(forms, { status: 'Disetujui' })).toEqual([])
  })
  test('combined filters with no match return an empty list', () => {
    expect(filterForms(forms, { q: 'dunia', status: 'Batal' })).toEqual([])
  })
})
