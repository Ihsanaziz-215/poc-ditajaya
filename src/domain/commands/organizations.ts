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
}

const MAX = 200

/** Edit Organization (fields of the live Organizations edit page). Status, Class and follow-up labels stay computed. */
export function editOrganization(db: Db, ctx: Ctx, cid: string, input: OrgInput): CommandResult {
  requireRole(ctx, 'Sales')
  const c = db.customers.find((x) => x.id === cid)
  if (!c) throw new DomainError('Organization tidak ditemukan.')
  const v = Object.fromEntries(Object.entries(input).map(([k, val]) => [k, String(val ?? '').trim()])) as unknown as OrgInput
  if (!v.name) throw new DomainError('Name wajib diisi.', { name: 'Name wajib diisi.' })
  if (Object.values(v).some((s) => s.length > MAX)) throw new DomainError(`Isian maksimal ${MAX} karakter.`)
  if (db.customers.some((x) => x.id !== cid && x.name.toLowerCase() === v.name.toLowerCase()))
    throw new DomainError('Nama organization sudah dipakai.', { name: 'Nama organization sudah dipakai.' })
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
