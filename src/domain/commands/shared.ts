import { rn } from '@/lib/format'
import { canPrice, canStruct, canSup } from '../permissions'
import { PERSON, ROLES } from '../types'
import type { Db } from '../types'
import { addLog, DomainError, getForm, nextId, notify, requireRole } from './core'
import type { Ctx } from './core'
import { branchedMessage, syncQuote } from './quoteSync'
import type { CommandResult } from './core'

export type ItemField = 'name' | 'qty' | 'price' | 'supplier'
const FL: Record<string, string> = { name: 'Nama Barang', qty: 'Qty', price: 'Harga', supplier: 'Supplier', eta: 'Estimasi Tiba', pnote: 'Catatan Purchasing' }
export const fieldValue = (k: string, v: unknown): string =>
  k === 'price' ? (v ? rn(Number(v)) : '—') : v === '' || v == null ? '—' : String(v)
export const fieldLabel = (k: string): string => FL[k]

const ITEM_FIELDS: ItemField[] = ['name', 'qty', 'price', 'supplier']

export function editItem(db: Db, ctx: Ctx, fid: string, iid: string, field: ItemField, value: string | number): CommandResult {
  if (!ITEM_FIELDS.includes(field)) throw new DomainError('Field tidak dapat diubah.')
  const f = getForm(db, fid)
  const it = f.items.find((i) => i.id === iid)
  if (!it) throw new DomainError('Barang tidak ditemukan.')
  const allowed =
    field === 'price' ? canPrice(f, ctx.role) : field === 'supplier' ? canSup(f, ctx.role) : canStruct(f, ctx.role)
  if (!allowed) throw new DomainError('Isi form terkunci untuk role ini di tahap ini.')
  const isNum = field === 'qty' || field === 'price'
  const nv = isNum ? Number(value) : String(value).trim()
  if (field === 'qty' && !(Number.isInteger(nv) && (nv as number) >= 1)) throw new DomainError('Qty minimal 1.')
  if (field === 'price' && !((nv as number) >= 0)) throw new DomainError('Harga tidak valid.')
  if (field === 'name' && !nv) throw new DomainError('Nama barang tidak boleh kosong.')
  const ov = it[field]
  if (ov === nv) return
  ;(it as unknown as Record<string, unknown>)[field] = nv
  addLog(ctx, f, `Ubah ${FL[field]} — ${field === 'name' ? ov : it.name}`, fieldValue(field, ov), fieldValue(field, nv))
  const b = ctx.role === 'Sales' ? syncQuote(db, ctx, f) : undefined
  if (b) return { message: branchedMessage(b), kind: 'info' }
}

export function addItem(db: Db, ctx: Ctx, fid: string, input: { name: string; qty: number }): CommandResult {
  const f = getForm(db, fid)
  if (!canStruct(f, ctx.role)) throw new DomainError('Isi form terkunci untuk role ini di tahap ini.')
  const name = input.name.trim()
  if (!name || !(Number.isInteger(input.qty) && input.qty >= 1)) throw new DomainError('Isi nama barang dan qty minimal 1.')
  f.items.push({ id: nextId(db), name, qty: input.qty, price: 0, supplier: '', proc: null, eta: '', pnote: '', good: 0, bad: 0, stock: 0, struck: false })
  addLog(ctx, f, 'Tambah barang', '—', `${name} × ${input.qty}`)
  const b = ctx.role === 'Sales' ? syncQuote(db, ctx, f) : undefined
  if (b) return { message: branchedMessage(b), kind: 'info' }
}

export function deleteItem(db: Db, ctx: Ctx, fid: string, iid: string): void {
  requireRole(ctx, 'Teknisi')
  const f = getForm(db, fid)
  if (f.status !== 'Draft') throw new DomainError('Barang hanya bisa dihapus pada form Draft.')
  const it = f.items.find((i) => i.id === iid)
  if (!it) throw new DomainError('Barang tidak ditemukan.')
  if (f.items.length < 2) throw new DomainError('Form harus punya minimal satu barang.')
  f.items = f.items.filter((i) => i.id !== iid)
  addLog(ctx, f, 'Hapus barang', `${it.name} × ${it.qty}`, '—')
}

export function addComment(db: Db, ctx: Ctx, fid: string, text: string) {
  const f = getForm(db, fid)
  const t = text.trim()
  if (!t) throw new DomainError('Comment tidak boleh kosong.')
  f.comments.push({ t: ctx.now, role: ctx.role, user: PERSON[ctx.role], text: t })
  notify(db, ctx, ROLES.filter((r) => r !== ctx.role), fid, `Comment baru dari ${ctx.role}: ${f.id}`)
  return { message: 'Comment terkirim. Role lain di form ini dinotifikasi.', kind: 'ok' as const }
}

export function markNotifRead(db: Db, ctx: Ctx, id: string): void {
  const n = db.notifs.find((x) => x.id === id)
  if (n) n.read[ctx.role] = true
}

export function markAllNotifsRead(db: Db, ctx: Ctx): void {
  db.notifs.forEach((n) => { if (n.roles.includes(ctx.role)) n.read[ctx.role] = true })
}
