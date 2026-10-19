import { iso } from '@/lib/format'
import type { Customer, Db, Form, Item, ProcStatus, Quote, QuoteItem, QuoteVersion, Role } from './types'

export const now = (db: Db): number => db.clock.sim + (Date.now() - db.clock.real)
export const today = (db: Db): Date => {
  const d = new Date(now(db))
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export const active = (f: Form): Item[] => f.items.filter((i) => !i.struck)
export const total = (f: Form): number => active(f).reduce((s, i) => s + i.qty * i.price, 0)

export function calc(v: { items: QuoteItem[] }) {
  const sub = v.items.reduce((s, i) => s + i.qty * i.price, 0)
  const disc = v.items.reduce((s, i) => s + (Number(i.disc) || 0), 0)
  const base = Math.max(sub - disc, 0)
  const tax = Math.round(base * 0.11)
  return { sub, disc, tax, grand: base + tax }
}

export const isExpired = (v: QuoteVersion, t: Date): boolean => !!v.expiry && new Date(v.expiry + 'T00:00:00') < t

/** Qty yang harus dibeli: kebutuhan dikurangi yang diambil dari stok gudang. */
export const need = (i: Item): number => (i.proc === 'In Stock' ? 0 : Math.max(i.qty - (i.fromStock || 0), 0))
export const remain = (i: Item): number => Math.max(need(i) - i.good - i.bad, 0)

const okItem = (i: Item) => i.proc === 'In Stock' || (!!i.proc && i.good >= need(i))
export const allGood = (f: Form): boolean => active(f).length > 0 && active(f).every(okItem)

const PRC: Record<string, number> = { 'Perlu Follow Up': 5, 'Belum Diproses': 4, Indent: 3, Dibeli: 2, 'In Stock': 1 }
export type ProcView = ProcStatus | 'Belum Diproses' | '—'
export type RecvView = 'Belum Diterima' | 'Diterima Baik' | 'Diterima Rusak' | 'Tidak Perlu' | '—'

/**
 * Status pengadaan per barang hanya maju: kosong → In Stock / Dibeli / Indent, lalu Indent → Dibeli.
 * Satu-satunya jalan mundur adalah retur (Gudang melapor rusak → Perlu Follow Up → Dibeli), sesuai PRD.
 */
export function canSetProc(cur: ProcStatus | null, next: 'In Stock' | 'Dibeli' | 'Indent'): boolean {
  if (cur === null) return true
  return cur === 'Indent' && next === 'Dibeli'
}

export function procOf(f: Form): ProcView {
  if (f.status !== 'Disetujui') return '—'
  const ps = active(f).map((i) => i.proc || 'Belum Diproses')
  if (!ps.length) return '—'
  return ps.sort((a, b) => PRC[b] - PRC[a])[0] as ProcView
}

export function recvOf(f: Form): RecvView {
  if (procOf(f) === '—') return '—'
  const a = active(f)
  if (a.some((i) => i.proc === 'Perlu Follow Up')) return 'Diterima Rusak'
  if (a.every((i) => i.proc === 'In Stock')) return 'Tidak Perlu'
  if (allGood(f)) return 'Diterima Baik'
  return 'Belum Diterima'
}

/** Every value statusOf can return, in lifecycle order (used by the list filter). */
export const LIST_STATUSES = ['Draft', 'Diajukan', 'Harga Terisi', 'Disetujui', 'Dibeli', 'Indent', 'In Stock', 'Perlu Follow Up', 'Diterima Baik', 'Tidak Sesuai', 'Sesuai', 'Selesai', 'Batal'] as const

/**
 * One status for list views, picked from the four PRD B1 groups by lifecycle position:
 * pengajuan until approved, then pengadaan until the goods are in, then konfirmasi.
 * The detail page still shows all four groups.
 */
export function statusOf(f: Form): string {
  if (f.done) return 'Selesai'
  if (f.status !== 'Disetujui') return f.status
  const p = procOf(f)
  if (p === 'Perlu Follow Up') return p
  if (p === 'Belum Diproses') return 'Disetujui'
  if (!allGood(f)) return p
  if (f.conf === 'Menunggu') return 'Diterima Baik'
  return f.conf
}

export interface Turn { role: Role; text: string; action: string }

function turnRaw(f: Form): Turn | null {
  if (f.done || f.status === 'Batal') return null
  if (f.status === 'Draft') return { role: 'Teknisi', action: 'Ajukan', text: 'Lengkapi daftar barang lalu ajukan form.' }
  if (f.status === 'Diajukan') return { role: 'Purchasing', action: 'Isi Harga', text: 'Isi harga dan supplier tiap barang, lalu kirim ke Sales.' }
  if (f.status === 'Harga Terisi')
    return { role: 'Sales', action: 'Putuskan', text: 'Sesuaikan harga dan qty, coret barang yang tidak dibutuhkan customer, kirim quotation, lalu putuskan Disetujui atau Batal.' }
  const p = procOf(f)
  if (p === 'Belum Diproses' || p === 'Perlu Follow Up')
    return {
      role: 'Purchasing',
      action: p === 'Belum Diproses' ? 'Cek Barang' : 'Follow Up',
      text: p === 'Belum Diproses'
        ? 'Cek barang yang disetujui customer: tandai In Stock, Dibeli, atau Indent.'
        : 'Follow up retur ke supplier, lalu kembali ke status Dibeli.',
    }
  if (!allGood(f)) return { role: 'Gudang', action: 'Stock In', text: 'Stock In barang yang datang beserta kondisinya.' }
  if (f.conf === 'Tidak Sesuai') return { role: 'Sales', action: 'Revisi', text: 'Pekerjaan terkunci. Revisi form bersama klien.' }
  if (f.conf === 'Sesuai') return { role: 'Teknisi', action: 'Kerjakan', text: 'Barang sesuai. Kerjakan breakdown.' }
  return { role: 'Teknisi', action: 'Konfirmasi', text: 'Cek barang lalu konfirmasi Sesuai atau Tidak Sesuai.' }
}

export function turnOf(f: Form): Turn | null {
  return turnRaw(f)
}

export function stepOf(f: Form, q?: Quote): { cur: number; stop?: boolean; warn?: boolean } {
  if (f.status === 'Draft') return { cur: 0 }
  if (f.status === 'Diajukan') return { cur: 1 }
  if (f.status === 'Harga Terisi') return { cur: q && q.versions[q.versions.length - 1].status === 'Terkirim' ? 3 : 2 }
  if (f.status === 'Batal') return { cur: 3, stop: true }
  if (f.done) return { cur: 8 }
  if (f.conf === 'Sesuai') return { cur: 7 }
  if (allGood(f)) return { cur: 6, warn: f.conf === 'Tidak Sesuai' }
  const p = procOf(f)
  if (p === 'Belum Diproses' || p === 'Perlu Follow Up') return { cur: 4 }
  return { cur: 5 }
}

export const STEPS: [string, Role][] = [
  ['Ajukan form', 'Teknisi'], ['Isi harga', 'Purchasing'], ['Edit & quotation', 'Sales'], ['Keputusan', 'Sales'],
  ['Pengadaan', 'Purchasing'], ['Penerimaan', 'Gudang'], ['Konfirmasi', 'Teknisi'], ['Kerjakan', 'Teknisi'],
]

export function labelOf(c: Customer, t: Date) {
  const last = c.purchases.reduce((m, p) => (p.date > m ? p.date : m), '')
  const cut = iso(new Date(t.getFullYear(), t.getMonth() - 6, t.getDate()))
  const mesin = c.purchases.filter((p) => p.type === 'mesin').reduce((s, p) => s + p.qty, 0)
  const cls = (mesin === 0 ? '—' : mesin <= 2 ? 'C' : mesin <= 5 ? 'B' : 'A') as 'A' | 'B' | 'C' | '—'
  return { last, cut, active: last >= cut, mesin, cls }
}

export const hasFollowUp = (c: Customer, t: Date): boolean => {
  const m = iso(t).slice(0, 7)
  return c.acts.some((a) => a.date.slice(0, 7) === m)
}
