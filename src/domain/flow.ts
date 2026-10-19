import type { Role } from './types'

export interface FlowStep {
  status: string
  owner: Role | null
  doing: string
  next: { to: string; when: string }[]
  /** Jalur pengecualian dari PRD (retur, revisi, batal). */
  exception?: boolean
}

/** Alur Form Breakdown menurut PRD B1: satu baris per status yang tampil di daftar form. */
export const FLOW: FlowStep[] = [
  { status: 'Draft', owner: 'Teknisi', doing: 'Isi data mesin, hasil analisa, dan daftar barang.', next: [{ to: 'Diajukan', when: 'Teknisi klik Ajukan' }] },
  { status: 'Diajukan', owner: 'Purchasing', doing: 'Isi harga dan supplier tiap barang.', next: [{ to: 'Harga Terisi', when: 'Semua harga dan supplier terisi, kirim ke Sales' }] },
  { status: 'Harga Terisi', owner: 'Sales', doing: 'Edit harga dan qty, coret barang, buat dan kirim quotation.', next: [{ to: 'Disetujui', when: 'Customer setuju' }, { to: 'Batal', when: 'Customer tidak jadi' }] },
  { status: 'Disetujui', owner: 'Purchasing', doing: 'Tanya Gudang soal stok, lalu tandai tiap barang: In Stock (tidak dibeli), Dibeli, atau Indent.', next: [{ to: 'In Stock / Dibeli / Indent', when: 'Semua barang sudah punya status pengadaan' }] },
  { status: 'In Stock / Dibeli / Indent', owner: 'Gudang', doing: 'Catat barang yang datang beserta kondisinya. Indent otomatis jadi Dibeli saat mulai datang.', next: [{ to: 'Diterima Baik', when: 'Semua barang diterima baik' }, { to: 'Perlu Follow Up', when: 'Ada barang diterima rusak' }] },
  { status: 'Perlu Follow Up', owner: 'Purchasing', doing: 'Retur ke supplier, lalu beli ulang.', exception: true, next: [{ to: 'In Stock / Dibeli / Indent', when: 'Selesai follow up, barang kembali ke Dibeli' }] },
  { status: 'Diterima Baik', owner: 'Teknisi', doing: 'Cek barang lalu konfirmasi.', next: [{ to: 'Sesuai', when: 'Barang sesuai' }, { to: 'Tidak Sesuai', when: 'Barang tidak sesuai, catatan wajib' }] },
  { status: 'Tidak Sesuai', owner: 'Sales', doing: 'Pekerjaan terkunci. Revisi form bersama klien.', exception: true, next: [{ to: 'Harga Terisi', when: 'Sales klik Revisi form, konfirmasi direset' }] },
  { status: 'Sesuai', owner: 'Teknisi', doing: 'Kerjakan breakdown.', next: [{ to: 'Selesai', when: 'Teknisi klik Kerjakan' }] },
  { status: 'Selesai', owner: null, doing: 'Breakdown selesai. Form hanya bisa dilihat.', next: [] },
  { status: 'Batal', owner: null, doing: 'Form ditutup oleh Sales. Tidak masuk antrean purchasing.', exception: true, next: [] },
]

const RANK: Record<string, number> = {
  Draft: 0, Diajukan: 1, 'Harga Terisi': 2, Disetujui: 3, 'In Stock': 4, Dibeli: 4, Indent: 4, 'Diterima Baik': 5, Sesuai: 6, Selesai: 7,
}

/**
 * Posisi status di jalur utama. Status pengecualian (Perlu Follow Up, Tidak Sesuai, Batal) tidak punya posisi,
 * karena hanya jalur ini yang boleh membuat status turun.
 */
export const rankOf = (status: string): number | null => RANK[status] ?? null
