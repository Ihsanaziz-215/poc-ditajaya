import { allGood } from '../derived'
import type { Db } from '../types'
import { PERSON } from '../types'
import { addLog, DomainError, getForm, nextId, notify, requireRole } from './core'
import type { CommandResult, Ctx } from './core'

export interface CreateFormInput {
  cust: string
  date: string
  analysis: string
  note: string
  items: { name: string; qty: number }[]
  submit: boolean
}

export function createForm(db: Db, ctx: Ctx, input: CreateFormInput): CommandResult {
  if (ctx.role !== 'Teknisi') throw new DomainError('Form baru hanya bisa dibuat oleh Teknisi.')
  const e: Record<string, string> = {}
  if (input.submit) {
    if (!input.cust) e.cust = 'Pilih customer.'
    if (!input.date) e.date = 'Isi tanggal analisa.'
    if (!input.analysis.trim()) e.analysis = 'Hasil analisa wajib diisi.'
    if (!input.items.some((i) => i.name.trim() && i.qty > 0)) e.items = 'Isi minimal satu barang dengan nama dan qty.'
    else if (input.items.some((i) => i.name.trim() && !(Number.isInteger(i.qty) && i.qty > 0))) e.items = 'Qty harus lebih dari 0.'
  } else if (!input.cust) {
    e.cust = 'Pilih customer untuk menyimpan draft.'
  }
  if (Object.keys(e).length) throw new DomainError(Object.values(e)[0], e)

  const d = new Date(ctx.now)
  const id = `BD-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${String(++db.seq.form).padStart(3, '0')}`
  const f = {
    id, cust: input.cust, tech: PERSON.Teknisi, date: input.date || '', analysis: input.analysis.trim(), note: input.note.trim(),
    items: input.items.filter((i) => i.name.trim() && i.qty > 0).map((i) => ({
      id: nextId(db), name: i.name.trim(), qty: i.qty, price: 0, supplier: '', proc: null, eta: '', pnote: '', good: 0, bad: 0, stock: 0, struck: false,
    })),
    status: input.submit ? ('Diajukan' as const) : ('Draft' as const),
    conf: 'Menunggu' as const, confNote: '', done: false, log: [], comments: [],
  }
  db.forms.unshift(f)
  addLog(ctx, f, 'Buat form', '—', 'Draft')
  let message = 'Draft tersimpan'
  if (input.submit) {
    addLog(ctx, f, 'Ubah status pengajuan', 'Draft', 'Diajukan')
    message = notify(db, ctx, ['Purchasing'], id, `Form Diajukan: ${id} ${f.cust}`)
  }
  return { message, kind: input.submit ? 'info' : 'ok', redirect: `/breakdown/${id}` }
}

export function submitDraft(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Teknisi')
  const f = getForm(db, fid)
  if (f.status !== 'Draft') throw new DomainError('Form sudah diajukan.')
  if (!f.items.length || f.items.some((i) => !i.name.trim() || !(i.qty > 0))) throw new DomainError('Lengkapi nama dan qty semua barang dulu.')
  f.status = 'Diajukan'
  addLog(ctx, f, 'Ubah status pengajuan', 'Draft', 'Diajukan')
  return { message: notify(db, ctx, ['Purchasing'], f.id, `Form Diajukan: ${f.id} ${f.cust}`), kind: 'info' }
}

export function confirmItems(db: Db, ctx: Ctx, fid: string, res: 'Sesuai' | 'Tidak Sesuai', note: string): CommandResult {
  requireRole(ctx, 'Teknisi')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.done || !allGood(f)) throw new DomainError('Konfirmasi baru aktif setelah semua barang Diterima Baik.')
  if (f.conf === 'Sesuai') throw new DomainError('Form sudah dikonfirmasi Sesuai.')
  const n = note.trim()
  if (res === 'Tidak Sesuai' && !n) throw new DomainError('Tulis catatan alasan Tidak Sesuai.')
  f.confNote = n
  addLog(ctx, f, 'Ubah status konfirmasi' + (n ? ` · ${n}` : ''), f.conf, res)
  f.conf = res
  if (res === 'Tidak Sesuai') return { message: notify(db, ctx, ['Sales', 'Purchasing'], f.id, `Konfirmasi Tidak Sesuai: ${f.id} ${f.cust}`), kind: 'info' }
  return { message: 'Konfirmasi Sesuai. Tombol kerjakan breakdown aktif.', kind: 'ok' }
}

export function finishWork(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Teknisi')
  const f = getForm(db, fid)
  if (f.status !== 'Disetujui' || f.conf !== 'Sesuai' || f.done) throw new DomainError('Pekerjaan belum bisa dimulai atau sudah selesai.')
  f.done = true
  addLog(ctx, f, 'Ubah status pekerjaan', 'Dikerjakan', 'Selesai')
  return { message: 'Breakdown selesai', kind: 'ok' }
}
