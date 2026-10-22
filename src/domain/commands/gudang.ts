import { active, allGood, remain } from '../derived'
import type { Db, Form, Item } from '../types'
import { addLog, DomainError, getForm, notify, requireRole } from './core'
import type { CommandResult, Ctx } from './core'

function whyNotReceivable(f: Form, i: Item): string | null {
  if (active(f).some((x) => !x.proc)) return 'Menunggu Purchasing mengecek barang'
  if (i.proc === 'In Stock') return 'Barang dari stok'
  if (i.proc === 'Perlu Follow Up') return 'Menunggu follow up Purchasing'
  if (!i.proc) return 'Menunggu Purchasing mengecek barang'
  if (remain(i) <= 0) return 'Sudah lengkap'
  return null
}

/** Barang Indent yang mulai datang otomatis jadi Dibeli, supaya status form tidak tertahan di Indent. */
function advanceIndent(ctx: Ctx, f: Form, it: Item): void {
  if (it.proc !== 'Indent') return
  it.proc = 'Dibeli'
  addLog(ctx, f, `Ubah status pengadaan — ${it.name}`, 'Indent', 'Dibeli', true)
}

export function receive(
  db: Db, ctx: Ctx, fid: string, iid: string,
  input: { date: string; qty: number; cond: 'Baik' | 'Rusak'; note: string },
): CommandResult {
  requireRole(ctx, 'Gudang')
  if (input.cond !== 'Baik' && input.cond !== 'Rusak') throw new DomainError('Kondisi harus Baik atau Rusak.')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.done) throw new DomainError('Penerimaan hanya untuk form Disetujui yang belum selesai.')
  const it = f.items.find((i) => i.id === iid)
  if (!it || it.struck) throw new DomainError('Barang tidak ditemukan atau dibatalkan.')
  const why = whyNotReceivable(f, it)
  if (why) throw new DomainError(why)
  const q = input.qty
  if (!input.date || !(Number.isInteger(q) && q >= 1)) throw new DomainError('Isi tanggal terima dan qty minimal 1.')
  if (q > remain(it)) throw new DomainError(`Qty melebihi sisa pesanan (${remain(it)}).`)
  const note = input.note.trim()
  advanceIndent(ctx, f, it)
  addLog(ctx, f, `Stock In ${it.name} ×${q} — ${input.cond} (Supplier: ${it.supplier})${note ? ` · ${note}` : ''}`, '', `${q} ${input.cond}`)
  if (input.cond === 'Baik') {
    it.good += q
    it.stock = (it.stock || 0) + q
    if (allGood(f)) return { message: notify(db, ctx, ['Teknisi'], f.id, `Barang Diterima Baik: ${f.id} siap dikonfirmasi`), kind: 'info' }
    return { message: `Stock In dicatat: ${it.name} ×${q} Baik`, kind: 'ok' }
  }
  it.bad += q
  const ov = it.proc
  it.proc = 'Perlu Follow Up'
  addLog(ctx, f, `Ubah status pengadaan — ${it.name}`, ov, 'Perlu Follow Up', true)
  return { message: notify(db, ctx, ['Purchasing'], f.id, `Barang Diterima Rusak: ${it.name} ×${q} (Supplier ${it.supplier})`), kind: 'info' }
}

export function receiveAll(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Gudang')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.done) throw new DomainError('Penerimaan hanya untuk form Disetujui yang belum selesai.')
  if (active(f).some((x) => !x.proc)) throw new DomainError('Menunggu Purchasing mengecek barang.')
  let n = 0
  active(f).forEach((i) => {
    if ((i.proc === 'Dibeli' || i.proc === 'Indent') && remain(i) > 0) {
      const q = remain(i)
      advanceIndent(ctx, f, i)
      i.good += q
      i.stock = (i.stock || 0) + q
      addLog(ctx, f, `Stock In ${i.name} ×${q} — Baik (Supplier: ${i.supplier})`, '', `${q} Baik`)
      n++
    }
  })
  if (!n) throw new DomainError('Tidak ada barang yang siap diterima (harus berstatus Dibeli atau Indent).')
  if (allGood(f)) notify(db, ctx, ['Teknisi'], f.id, `Barang Diterima Baik: ${f.id} siap dikonfirmasi`)
  return { message: `${n} barang dicatat Diterima Baik`, kind: 'ok' }
}
