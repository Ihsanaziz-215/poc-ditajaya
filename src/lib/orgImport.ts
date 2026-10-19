import type { OrgInput } from '@/domain/commands/organizations'

export const ORG_COLUMNS = ['Name', 'Address', 'Country', 'City', 'Province', 'Postal Code', 'Sales Owner'] as const
const KEYS: Record<string, keyof OrgInput> = {
  name: 'name', address: 'addr', country: 'country', city: 'city', province: 'province', 'postal code': 'postal', postal: 'postal', 'sales owner': 'owner',
}

/** Minimal CSV parser (quoted fields, escaped quotes, CRLF). Delimiter is detected from the header line. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const first = src.split(/\r?\n/, 1)[0] ?? ''
  const d = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === d) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/** Turns sheet rows (first row = header) into organization inputs. Unknown columns are ignored; empty rows are skipped. */
export function rowsToOrgs(rows: unknown[][]): OrgInput[] {
  const [head, ...body] = rows
  if (!head) return []
  const idx = head.map((h) => KEYS[String(h ?? '').trim().toLowerCase()])
  if (!idx.includes('name')) throw new Error('Kolom "Name" tidak ditemukan di baris pertama.')
  return body
    .map((r) => {
      const o: OrgInput = { name: '', addr: '', country: 'Indonesia', city: '', province: '', postal: '', owner: '' }
      idx.forEach((k, c) => { if (k) o[k] = String(r[c] ?? '').trim() })
      return o
    })
    .filter((o) => o.name || o.addr || o.city)
}

export const templateCsv = (): string => ORG_COLUMNS.join(',') + '\nPT Contoh Jaya,Jl. Contoh No. 1,Indonesia,Jakarta,DKI Jakarta,12345,Sales\n'
