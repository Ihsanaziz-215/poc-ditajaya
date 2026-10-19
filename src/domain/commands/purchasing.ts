import { active, allGood } from '../derived'
import type { Db, Form, Item, ProcStatus, Supplier } from '../types'
import { addLog, DomainError, getForm, nextId, notify, requireRole } from './core'
import type { CommandResult, Ctx } from './core'
import { fieldLabel, fieldValue } from './shared'

function procContext(db: Db, ctx: Ctx, fid: string, iid?: string): { f: Form; it: Item } {
  requireRole(ctx, 'Purchasing')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.done) throw new DomainError('Pengadaan hanya bisa diproses pada form Disetujui.')
  const it = iid ? f.items.find((i) => i.id === iid) : undefined
  if (iid && (!it || it.struck)) throw new DomainError('Barang tidak ditemukan atau dicoret.')
  return { f, it: it as Item }
}

export function sendToSales(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Purchasing')
  const f = getForm(db, fid)
  if (f.status !== 'Diajukan') throw new DomainError('Form tidak sedang menunggu harga dari Purchasing.')
  const missing = f.items.filter((i) => !(i.price > 0) || !i.supplier)
  if (missing.length) {
    throw new DomainError('Harga dan supplier wajib terisi untuk semua barang.', Object.fromEntries(missing.map((i) => [`item:${i.id}`, 'wajib'])))
  }
  f.status = 'Harga Terisi'
  addLog(ctx, f, 'Ubah status pengajuan', 'Diajukan', 'Harga Terisi')
  return { message: notify(db, ctx, ['Sales'], f.id, `Harga Terisi: ${f.id} ${f.cust}`), kind: 'info' }
}

export function setProc(db: Db, ctx: Ctx, fid: string, iid: string, v: 'In Stock' | 'Dibeli' | 'Indent'): CommandResult {
  const { f, it } = procContext(db, ctx, fid, iid)
  if (!['In Stock', 'Dibeli', 'Indent'].includes(v)) throw new DomainError('Status pengadaan tidak valid.')
  if (it.proc === 'Perlu Follow Up') throw new DomainError('Selesaikan follow up retur dulu.')
  if (it.proc === v) return
  addLog(ctx, f, `Ubah status pengadaan — ${it.name}`, it.proc || 'Belum Diproses', v)
  it.proc = v
  if (allGood(f)) return { message: notify(db, ctx, ['Teknisi'], f.id, `Barang siap: ${f.id} bisa dikonfirmasi`), kind: 'info' }
}

export function setProcInfo(db: Db, ctx: Ctx, fid: string, iid: string, key: 'eta' | 'pnote', value: string): void {
  if (key !== 'eta' && key !== 'pnote') throw new DomainError('Field tidak dapat diubah.')
  const { f, it } = procContext(db, ctx, fid, iid)
  const v = value.trim()
  if (it[key] === v) return
  addLog(ctx, f, `Ubah ${fieldLabel(key)} — ${it.name}`, fieldValue(key, it[key]), fieldValue(key, v))
  it[key] = v
}

export function resolveFollowUp(db: Db, ctx: Ctx, fid: string, iid: string): CommandResult {
  const { f, it } = procContext(db, ctx, fid, iid)
  if (it.proc !== 'Perlu Follow Up') throw new DomainError('Barang ini tidak sedang menunggu follow up.')
  addLog(ctx, f, `Follow up retur selesai — ${it.name} ×${it.bad} dikembalikan ke ${it.supplier}`, 'Perlu Follow Up', 'Dibeli')
  it.bad = 0
  it.proc = 'Dibeli' as ProcStatus
  return { message: 'Barang dibeli ulang. Gudang bisa mencatat penerimaan lagi.', kind: 'ok' }
}

export function markAllBought(db: Db, ctx: Ctx, fid: string): CommandResult {
  const { f } = procContext(db, ctx, fid)
  let n = 0
  active(f).forEach((i) => {
    if (!i.proc) {
      addLog(ctx, f, `Ubah status pengadaan — ${i.name}`, 'Belum Diproses', 'Dibeli')
      i.proc = 'Dibeli'
      n++
    }
  })
  return n ? { message: `${n} barang ditandai Dibeli`, kind: 'ok' } : { message: 'Semua barang sudah punya status pengadaan' }
}

export function saveSupplier(db: Db, ctx: Ctx, input: { id?: string; name: string; contact: string; cats: string[]; active: boolean }): CommandResult {
  requireRole(ctx, 'Purchasing')
  const name = input.name.trim()
  if (!name) throw new DomainError('Nama supplier wajib diisi.')
  const o = { name, contact: input.contact.trim(), cats: input.cats.map((c) => c.trim()).filter(Boolean), active: input.active }
  if (input.id) {
    const s = db.suppliers.find((x) => x.id === input.id)
    if (!s) throw new DomainError('Supplier tidak ditemukan.')
    Object.assign(s, o)
  } else {
    db.suppliers.unshift({ id: nextId(db), ...o } as Supplier)
  }
  return { message: 'Supplier disimpan.', kind: 'ok' }
}

export function toggleSupplier(db: Db, ctx: Ctx, id: string): CommandResult {
  requireRole(ctx, 'Purchasing')
  const s = db.suppliers.find((x) => x.id === id)
  if (!s) throw new DomainError('Supplier tidak ditemukan.')
  s.active = !s.active
  return { message: `${s.name} ${s.active ? 'diaktifkan' : 'dinonaktifkan'}` }
}
