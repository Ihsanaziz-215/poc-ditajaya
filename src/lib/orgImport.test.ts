import { describe, expect, test } from 'vitest'
import { parseCsv, rowsToOrgs, templateCsv } from './orgImport'

describe('parseCsv', () => {
  test('handles quotes, escaped quotes, commas inside fields and CRLF', () => {
    const csv = 'Name,Address\r\n"PT A, B","Jl. ""Baru"""\r\nPT C,x'
    expect(parseCsv(csv)).toEqual([['Name', 'Address'], ['PT A, B', 'Jl. "Baru"'], ['PT C', 'x']])
  })
  test('detects semicolon delimiter and strips a BOM', () => {
    expect(parseCsv('﻿Name;City\nPT A;Bogor')).toEqual([['Name', 'City'], ['PT A', 'Bogor']])
  })
})

describe('rowsToOrgs', () => {
  test('maps headers case-insensitively, ignores unknown columns and empty rows', () => {
    const rows = [['name', 'ADDRESS', 'Postal Code', 'Foo', 'sales owner'], ['PT A', 'Jl. A', 12345, 'x', 'Sales'], ['', '', '', '', ''], ['PT B']]
    expect(rowsToOrgs(rows)).toEqual([
      { name: 'PT A', addr: 'Jl. A', country: 'Indonesia', city: '', province: '', postal: '12345', owner: 'Sales', pic: '', email: '', phone: '' },
      { name: 'PT B', addr: '', country: 'Indonesia', city: '', province: '', postal: '', owner: '', pic: '', email: '', phone: '' },
    ])
  })
  test('requires a Name column', () => {
    expect(() => rowsToOrgs([['Address'], ['x']])).toThrow('Kolom "Name"')
    expect(rowsToOrgs([])).toEqual([])
  })
  test('the downloadable template parses back into one valid row', () => {
    const rows = rowsToOrgs(parseCsv(templateCsv()))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'PT Contoh Jaya', city: 'Jakarta', postal: '12345', owner: 'Sales' })
  })
})
