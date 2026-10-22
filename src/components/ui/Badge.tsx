import type { Role } from '@/domain/types'

const BCOL: Record<string, string> = {
  Disetujui: 'ok', 'Diterima Baik': 'ok', Sesuai: 'ok', Selesai: 'ok', Dibeli: 'ok', Terkirim: 'ok', Active: 'ok', Aktif: 'ok',
  Batal: 'bad', 'Diterima Rusak': 'bad', 'Tidak Sesuai': 'bad', 'Perlu Follow Up': 'bad', 'Gagal Kirim': 'bad', Kedaluwarsa: 'bad',
  Indent: 'warn', 'Non Active': 'gray', Nonaktif: 'gray', 'Belum Dikirim': 'gray', Draft: 'gray', Menunggu: 'gray',
  'Belum Diterima': 'gray', '—': 'gray', Diajukan: 'info', 'Harga Terisi': 'info', 'In Stock': 'info',
  'Belum Diproses': 'gray', Dibatalkan: 'gray', 'Tidak Perlu': 'gray',
}

export function Badge({ v }: { v: string }) {
  return <span className={`b ${BCOL[v] || 'gray'}`}>{v}</span>
}

const RCOL: Record<Role, string> = { Teknisi: 'info', Purchasing: 'warn', Sales: 'pri', Gudang: 'ok' }
export function RoleBadge({ r }: { r: string }) {
  return <span className={`b ${RCOL[r as Role] || 'gray'}`}>{r}</span>
}

export function Tbc({ t }: { t: string }) {
  return <span className="tbc" title={t}>TBC</span>
}
