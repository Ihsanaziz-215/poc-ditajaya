import { iso } from '@/lib/format'
import { active, today } from '../derived'
import { PERSON } from '../types'
import type { Db, Quote, QuoteVersion } from '../types'
import { addLog, DomainError, getForm, nextId, notify, requireRole } from './core'
import type { CommandResult, Ctx } from './core'
import { branchedMessage, lastVersion, newVersion, syncQuote } from './quoteSync'

export function setStrike(db: Db, ctx: Ctx, fid: string, iid: string, struck: boolean): CommandResult {
  requireRole(ctx, 'Sales')
  const f = getForm(db, fid)
  if (f.status !== 'Harga Terisi') throw new DomainError('Barang hanya bisa dicoret saat form berstatus Harga Terisi.')
  const it = f.items.find((i) => i.id === iid)
  if (!it) throw new DomainError('Barang tidak ditemukan.')
  if (it.struck === struck) return
  if (struck && active(f).length < 2) throw new DomainError('Minimal satu barang harus tetap aktif.')
  it.struck = struck
  addLog(ctx, f, `${struck ? 'Coret' : 'Batal coret'} barang — ${it.name}`, struck ? 'Aktif' : 'Dicoret', struck ? 'Dicoret' : 'Aktif')
  const b = syncQuote(db, ctx, f)
  if (b) return { message: branchedMessage(b), kind: 'info' }
  return struck
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getQuote(db: Db, qid: string): Quote {
  const q = db.quotes.find((x) => x.id === qid)
  if (!q) throw new DomainError('Quote tidak ditemukan.')
  return q
}

export function makeQuote(db: Db, ctx: Ctx, fid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const f = getForm(db, fid)
  if (f.status !== 'Harga Terisi') throw new DomainError('Quotation hanya bisa dibuat setelah harga terisi dan sebelum keputusan.')
  if (db.quotes.some((q) => q.formId === fid)) throw new DomainError('Form ini sudah punya quotation.')
  const c = db.customers.find((x) => x.name === f.cust)
  const seq = ++db.seq.quote
  const id = 'Q' + seq
  const exp = new Date(ctx.now)
  exp.setHours(0, 0, 0, 0)
  exp.setDate(exp.getDate() + 14)
  const v: QuoteVersion = {
    ver: 1, date: ctx.now, expiry: iso(exp), subject: `Penawaran ${f.cust}`, desc: '', owner: PERSON.Sales,
    pic: c?.pic || '', email: c?.email || '', addr: c?.addr || '', lead: '',
    termin: 'DP 50% setelah PO, pelunasan setelah pekerjaan selesai', estimasi: '7-14 hari kerja setelah barang diterima', catatan: '',
    status: 'Belum Dikirim', sentTo: '', cc: '', sentAt: null,
    items: active(f).map((i) => ({ iid: i.id, name: i.name, qty: i.qty, price: i.price, disc: 0 })),
  }
  db.quotes.push({ id, number: `DMP/U/2026/X/QT${String(seq).padStart(4, '0')}`, formId: fid, versions: [v] })
  addLog(ctx, f, 'Buat Quotation v1', '—', 'Belum Dikirim')
  return { message: 'Quotation dibuat dari Form Breakdown. Item dan harga terisi otomatis.', kind: 'ok', redirect: `/quotes/${id}` }
}

export type QuoteField = 'subject' | 'desc' | 'owner' | 'expiry' | 'pic' | 'email' | 'addr' | 'termin' | 'estimasi' | 'catatan'

const QUOTE_FIELDS: QuoteField[] = ['subject', 'desc', 'owner', 'expiry', 'pic', 'email', 'addr', 'termin', 'estimasi', 'catatan']

export function setQuoteField(db: Db, ctx: Ctx, qid: string, key: QuoteField, value: string): CommandResult {
  requireRole(ctx, 'Sales')
  if (!QUOTE_FIELDS.includes(key)) throw new DomainError('Field quotation tidak dapat diubah.')
  const q = getQuote(db, qid)
  let v = lastVersion(q)
  if (v[key] === value) return
  const branch = v.status === 'Terkirim'
  if (branch) v = newVersion(db, ctx, q, 'revisi isi quotation')
  v[key] = value
  if (branch) return { message: branchedMessage(v), kind: 'info', redirect: `/quotes/${q.id}` }
}

export function setQuoteDiscount(db: Db, ctx: Ctx, qid: string, iid: string, value: number | string): CommandResult {
  requireRole(ctx, 'Sales')
  const q = getQuote(db, qid)
  const n = Math.max(Number(value) || 0, 0)
  let v = lastVersion(q)
  const cur = v.items.find((i) => i.iid === iid)
  if (!cur) throw new DomainError('Item quotation tidak ditemukan.')
  if (cur.disc === n) return
  const branch = v.status === 'Terkirim'
  if (branch) v = newVersion(db, ctx, q, 'revisi diskon')
  v.items.find((i) => i.iid === iid)!.disc = n
  if (branch) return { message: branchedMessage(v), kind: 'info', redirect: `/quotes/${q.id}?tab=items` }
}

function quoteForm(db: Db, q: Quote) {
  return q.formId ? db.forms.find((x) => x.id === q.formId) : undefined
}

/** Barang habis pakai (mur, lem) yang ditagih ke client: hanya ada di quotation, tidak masuk form, pengadaan, atau penerimaan. */
export function addQuoteExtra(db: Db, ctx: Ctx, qid: string, input: { name: string; qty: number; price: number; unit?: string }): CommandResult {
  requireRole(ctx, 'Sales')
  const q = getQuote(db, qid)
  const name = input.name.trim().slice(0, 200)
  if (!name) throw new DomainError('Isi nama barang.')
  if (!(Number.isInteger(input.qty) && input.qty >= 1)) throw new DomainError('Qty minimal 1.')
  if (!(Number(input.price) >= 0)) throw new DomainError('Harga tidak valid.')
  let v = lastVersion(q)
  const branch = v.status === 'Terkirim'
  if (branch) v = newVersion(db, ctx, q, 'tambah barang non-stok')
  const unit = (input.unit ?? '').trim().slice(0, 50)
  v.items.push({ iid: nextId(db), name, qty: input.qty, price: Number(input.price), disc: 0, unit: unit || undefined, extra: true })
  const f = quoteForm(db, q)
  if (f) addLog(ctx, f, `Tambah barang di quotation v${v.ver}`, '—', `${name} × ${input.qty}${unit ? ' ' + unit : ''}`)
  return branch ? { message: branchedMessage(v), kind: 'info', redirect: `/quotes/${q.id}?tab=items` } : { message: 'Barang ditambahkan ke quotation. Tidak masuk pengadaan.', kind: 'ok' }
}

export function removeQuoteExtra(db: Db, ctx: Ctx, qid: string, iid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const q = getQuote(db, qid)
  let v = lastVersion(q)
  const cur = v.items.find((i) => i.iid === iid)
  if (!cur?.extra) throw new DomainError('Hanya barang tambahan quotation yang bisa dihapus.')
  const branch = v.status === 'Terkirim'
  if (branch) v = newVersion(db, ctx, q, 'hapus barang non-stok')
  v.items = v.items.filter((i) => i.iid !== iid)
  const f = quoteForm(db, q)
  if (f) addLog(ctx, f, `Hapus barang di quotation v${v.ver}`, `${cur.name} × ${cur.qty}`, '—')
  return branch ? { message: branchedMessage(v), kind: 'info', redirect: `/quotes/${q.id}?tab=items` } : { message: 'Barang dihapus dari quotation.' }
}

export function sendQuote(db: Db, ctx: Ctx, qid: string, input: { to: string; cc: string; fail: boolean }): CommandResult {
  requireRole(ctx, 'Sales')
  const q = getQuote(db, qid)
  const to = input.to.trim()
  const cc = input.cc.trim()
  if (!EMAIL.test(to)) throw new DomainError('Email tujuan belum valid. Email PIC wajib untuk pengiriman.')
  const v = lastVersion(q)
  const resend = !!v.sentAt || v.status === 'Gagal Kirim'
  const old = v.status
  v.sentTo = to
  v.cc = cc
  v.sentAt = ctx.now
  v.status = input.fail ? 'Gagal Kirim' : 'Terkirim'
  const f = q.formId ? db.forms.find((x) => x.id === q.formId) : undefined
  if (f) addLog(ctx, f, `${resend ? 'Kirim ulang' : 'Kirim'} Quotation v${v.ver} ke ${to}${cc ? ` (CC ${cc})` : ''}`, old, v.status)
  return input.fail
    ? { message: `Pengiriman gagal ke ${to}. Kirim ulang dari halaman quote.`, kind: 'bad' }
    : { message: `Quotation v${v.ver} terkirim ke ${to}`, kind: 'ok' }
}

export function recordFollowUp(db: Db, ctx: Ctx, cid: string): CommandResult {
  requireRole(ctx, 'Sales')
  const c = db.customers.find((x) => x.id === cid)
  if (!c) throw new DomainError('Customer tidak ditemukan.')
  c.acts.push({ date: iso(today(db)), what: 'Follow up (demo)' })
  db.notifs = db.notifs.filter((n) => n.cid !== cid)
  return { message: `Follow up ${c.name} dicatat sebagai Activity. Notifikasi dihapus.`, kind: 'ok' }
}
