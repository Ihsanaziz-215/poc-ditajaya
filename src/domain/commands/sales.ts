import { active } from '../derived'
import type { Db } from '../types'
import { addLog, DomainError, getForm, notify, requireRole } from './core'
import type { CommandResult, Ctx } from './core'
import { syncQuote } from './quoteSync'

export function toggleStrike(db: Db, ctx: Ctx, fid: string, iid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const f = getForm(db, fid)
  if (f.status !== 'Harga Terisi') throw new DomainError('Barang hanya bisa dicoret saat form berstatus Harga Terisi.')
  const it = f.items.find((i) => i.id === iid)
  if (!it) throw new DomainError('Barang tidak ditemukan.')
  if (!it.struck && active(f).length < 2) throw new DomainError('Minimal satu barang harus tetap aktif.')
  it.struck = !it.struck
  addLog(ctx, f, `${it.struck ? 'Coret' : 'Batal coret'} barang — ${it.name}`, it.struck ? 'Aktif' : 'Dicoret', it.struck ? 'Dicoret' : 'Aktif')
  syncQuote(db, ctx, f)
  return it.struck
    ? { message: 'Barang dicoret. Tidak ikut dibeli dan tidak masuk quotation.', kind: 'info' }
    : { message: 'Coret dibatalkan.' }
}

export function decide(db: Db, ctx: Ctx, fid: string, res: 'Disetujui' | 'Batal'): CommandResult {
  requireRole(ctx, 'Sales')
  const f = getForm(db, fid)
  if (f.status !== 'Harga Terisi') throw new DomainError('Form tidak sedang menunggu keputusan Sales.')
  if (res !== 'Disetujui' && res !== 'Batal') throw new DomainError('Keputusan tidak valid.')
  const old = f.status
  f.status = res
  addLog(ctx, f, 'Ubah status pengajuan', old, res)
  return { message: notify(db, ctx, ['Purchasing', 'Teknisi'], f.id, `${res}: ${f.id} ${f.cust}`), kind: 'info' }
}

export function reviseForm(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.conf !== 'Tidak Sesuai' || f.done) throw new DomainError('Revisi hanya untuk form yang dikonfirmasi Tidak Sesuai.')
  f.status = 'Harga Terisi'
  f.conf = 'Menunggu'
  addLog(ctx, f, 'Ubah status pengajuan', 'Disetujui', 'Harga Terisi')
  addLog(ctx, f, 'Ubah status konfirmasi', 'Tidak Sesuai', 'Menunggu')
  return { message: 'Form kembali ke Sales untuk direvisi', kind: 'info' }
}
