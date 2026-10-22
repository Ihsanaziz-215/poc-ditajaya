import type { Db } from '../types'
import { DomainError, requireRole } from './core'
import type { CommandResult, Ctx } from './core'

export interface OrgInput {
  name: string
  addr: string
  country: string
  city: string
  province: string
  postal: string
  owner: string
  /** Kontak perusahaan. PIC dan email dipakai quotation (Up. dan tujuan kirim), telp tampil di Form Breakdown. */
  pic: string
  email: string
  phone: string
}

const MAX = 200

function clean(input: OrgInput): OrgInput {
  const v = Object.fromEntries(Object.entries(input).map(([k, val]) => [k, String(val ?? '').trim()])) as unknown as OrgInput
  if (!v.name) throw new DomainError('Name wajib diisi.', { name: 'Name wajib diisi.' })
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) throw new DomainError('Format email tidak valid.', { email: 'Format email tidak valid.' })
  if (Object.values(v).some((s) => s.length > MAX)) throw new DomainError(`Isian maksimal ${MAX} karakter.`)
  return v
}
const taken = (db: Db, name: string, except?: string) => db.customers.some((x) => x.id !== except && x.name.toLowerCase() === name.toLowerCase())

/** Create Organization. A new organization has no purchases or activities yet, so it starts Non Active without a class. */
export function createOrganization(db: Db, ctx: Ctx, input: OrgInput): CommandResult {
  requireRole(ctx, 'Sales')
  const v = clean(input)
  if (taken(db, v.name)) throw new DomainError('Nama organization sudah dipakai.', { name: 'Nama organization sudah dipakai.' })
  db.customers.unshift({
    id: 'c' + (db.seq.id = db.seq.id + 1), no: Math.max(0, ...db.customers.map((c) => c.no ?? 0)) + 1, persons: 0, createdAt: ctx.now,
    purchases: [], acts: [], ...v,
  })
  return { message: `${v.name} dibuat.`, kind: 'ok', redirect: '/organizations' }
}

/** Import Excel/CSV rows. Rows without a name or with a name that already exists are skipped, the rest are created. */
export function importOrganizations(db: Db, ctx: Ctx, rows: OrgInput[]): CommandResult {
  requireRole(ctx, 'Sales')
  if (!rows.length) throw new DomainError('File tidak berisi baris data.')
  if (rows.length > 500) throw new DomainError('Maksimal 500 baris per import.')
  let made = 0
  let dup = 0
  let bad = 0
  for (const r of rows) {
    let v: OrgInput
    try { v = clean(r) } catch { bad++; continue }
    if (taken(db, v.name)) { dup++; continue }
    createOrganization(db, ctx, v)
    made++
  }
  const parts = [`${made} organization dibuat`, dup ? `${dup} nama sudah ada` : '', bad ? `${bad} baris tidak valid` : ''].filter(Boolean)
  return { message: parts.join(', ') + '.', kind: made ? 'ok' : 'info' }
}

/** Edit Organization (fields of the live Organizations edit page). Status, Class and follow-up labels stay computed. */
export function editOrganization(db: Db, ctx: Ctx, cid: string, input: OrgInput): CommandResult {
  requireRole(ctx, 'Sales')
  const c = db.customers.find((x) => x.id === cid)
  if (!c) throw new DomainError('Organization tidak ditemukan.')
  const v = clean(input)
  if (taken(db, v.name, cid)) throw new DomainError('Nama organization sudah dipakai.', { name: 'Nama organization sudah dipakai.' })
  if (v.name !== c.name) db.forms.forEach((f) => { if (f.cust === c.name) f.cust = v.name })
  Object.assign(c, v)
  return { message: 'Organization disimpan.', kind: 'ok', redirect: '/organizations' }
}

/** Delete Organization. Refused while forms still reference the customer, so no form loses its customer. */
export function deleteOrganization(db: Db, ctx: Ctx, cid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const c = db.customers.find((x) => x.id === cid)
  if (!c) throw new DomainError('Organization tidak ditemukan.')
  const n = db.forms.filter((f) => f.cust === c.name).length
  if (n) throw new DomainError(`${c.name} masih punya ${n} form breakdown, jadi belum bisa dihapus.`)
  db.customers = db.customers.filter((x) => x.id !== cid)
  db.notifs = db.notifs.filter((x) => x.cid !== cid)
  return { message: `${c.name} dihapus.`, kind: 'ok' }
}
