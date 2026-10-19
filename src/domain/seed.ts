import { rn } from '@/lib/format'
import { active as act } from './derived'
import { PERSON } from './types'
import type { Comment, Customer, Db, Form, Item, LogEntry, Notif, Quote, QuoteVersion, Role } from './types'

/** Deterministic dataset ported from the prototype (proto:257-353). */
export function buildSeed(real: number): Db {
  let n = 100
  const uid = () => 'i' + ++n
  const D = (m: number, d: number, h = 9, mi = 0) => new Date(2026, m - 1, d, h, mi).getTime()
  const P = PERSON
  let qseq = 3000
  const qno = (k: number) => `DMP/U/2026/X/QT${String(k).padStart(4, '0')}`

  const suppliers = [
    { id: 's1', name: 'CV Sumber Teknik Udara', contact: '0812-1000-2001', pic: 'Pak Wawan', cats: ['Kompresor', 'Sparepart mesin'], active: true },
    { id: 's2', name: 'PT Cipta Refrigerasi Nusantara', contact: '0813-2000-3002', pic: 'Bu Maya', cats: ['Refrigerasi', 'Freon'], active: true },
    { id: 's3', name: 'Toko Listrik Mandiri', contact: '0811-3000-4003', pic: 'Koh Aming', cats: ['Kelistrikan'], active: true },
    { id: 's4', name: 'PT Filtra Indo Perkasa', contact: '0856-4000-5004', pic: 'Pak Dedi', cats: ['Filter'], active: true },
    { id: 's5', name: 'UD Gas Industri Jaya', contact: '0878-5000-6005', pic: 'Pak Eko', cats: ['Gas industri'], active: true },
    { id: 's6', name: 'CV Bearing Prima', contact: '0852-6000-7006', pic: 'Bu Tia', cats: ['Bearing', 'Sparepart mesin'], active: false },
  ]
  const pc = (date: string, type: 'mesin' | 'sparepart', what: string, qty = 1) => ({ date, type, what, qty })
  const base: Omit<Customer, 'acts'>[] = [
    { id: 'c1', country: 'Indonesia', city: 'Bekasi', province: 'Jawa Barat', postal: '17530', owner: 'Sales', no: 777, persons: 0, createdAt: D(9, 17, 17, 51), name: 'PT Sarana Sentra', pic: 'Bapak Hendra', email: 'hendra@saranasentra.example', addr: 'Jl. Industri Raya No. 12, Bekasi', purchases: [pc('2025-03-10', 'mesin', 'Kompresor screw', 2), pc('2025-11-02', 'mesin', 'Dryer', 2), pc('2026-08-14', 'sparepart', 'Filter element', 3)] },
    { id: 'c2', country: 'Indonesia', city: 'Cikarang', province: 'Jawa Barat', postal: '17530', owner: 'Sales', no: 778, persons: 1, createdAt: D(9, 17, 17, 51), name: 'PT Dunia Mega Raya', pic: 'Ibu Wulan', email: 'wulan@duniamegaraya.example', addr: 'Kawasan MM2100 Blok C-5, Cikarang', purchases: [pc('2024-05-20', 'mesin', 'Kompresor', 3), pc('2025-09-01', 'mesin', 'Kompresor', 3), pc('2026-09-18', 'sparepart', 'Contactor', 2)] },
    { id: 'c3', country: 'Indonesia', city: 'jakarta', province: 'jakarta', postal: '12260', owner: 'Sales', no: 783, persons: 3, createdAt: D(9, 23, 8, 23), name: 'PT Jati Karya', pic: 'Bapak Rahmat', email: 'rahmat@jatikarya.example', addr: 'Jalan Baru', purchases: [pc('2025-04-04', 'mesin', 'Kompresor', 2), pc('2025-12-15', 'sparepart', 'V-belt', 4)] },
    { id: 'c4', country: 'Indonesia', city: 'Jakarta', province: 'DKI Jakarta', postal: '12950', owner: 'Sales', no: 779, persons: 0, createdAt: D(9, 17, 17, 51), name: 'PT ABC', pic: 'Bapak Andi', email: 'andi@abc.example', addr: 'Jl. Gatot Subroto 88, Jakarta', purchases: [pc('2026-01-22', 'mesin', 'Kompresor', 1)] },
    { id: 'c5', country: 'Indonesia', city: 'Jakarta Utara', province: 'DKI Jakarta', postal: '14250', owner: 'Sales', no: 780, persons: 2, createdAt: D(9, 17, 17, 51), name: 'PT Dharma Polimetal', pic: 'Ibu Sinta', email: 'sinta@dharmapolimetal.example', addr: 'Jl. Pegangsaan Dua Km 1, Jakarta Utara', purchases: [pc('2025-06-12', 'mesin', 'Dryer', 3), pc('2026-07-05', 'sparepart', 'Oil separator', 1)] },
    { id: 'c6', country: 'Indonesia', city: 'Jakarta Barat', province: 'DKI Jakarta', postal: '11710', owner: 'Sales', no: 781, persons: 1, createdAt: D(9, 17, 17, 51), name: 'PT Mitra Kompresor Abadi', pic: 'Bapak Yusuf', email: 'yusuf@mitrakompresor.example', addr: 'Jl. Daan Mogot Km 14, Jakarta Barat', purchases: [pc('2026-10-01', 'sparepart', 'Coupling element', 1)] },
    { id: 'c7', country: 'Indonesia', city: 'Semarang', province: 'Jawa Tengah', postal: '50171', owner: 'Sales', no: 776, persons: 0, createdAt: D(9, 17, 17, 51), name: 'PT Karya Logam Utama', pic: 'Ibu Lestari', email: 'lestari@karyalogam.example', addr: 'Jl. Tambak Aji 5, Semarang', purchases: [pc('2024-08-08', 'mesin', 'Kompresor', 2), pc('2025-02-17', 'mesin', 'Kompresor', 3), pc('2026-04-10', 'sparepart', 'Filter', 2)] },
    { id: 'c8', country: 'Indonesia', city: 'Tangerang', province: 'Banten', postal: '15710', owner: 'Sales', no: 782, persons: 0, createdAt: D(9, 17, 17, 51), name: 'PT Nusa Pangan Makmur', pic: 'Bapak Dodi', email: 'dodi@nusapangan.example', addr: 'Jl. Raya Serang Km 12, Tangerang', purchases: [pc('2026-09-30', 'mesin', 'Kompresor', 1)] },
  ]
  const ACTS: Record<string, [string, string][]> = {
    c1: [['2026-09-10', 'Call follow up penawaran dryer'], ['2026-10-14', 'Meeting online bahas form breakdown']],
    c2: [['2026-09-20', 'Call follow up kontak panel']],
    c3: [['2026-09-05', 'Call follow up penawaran V-belt']],
    c4: [['2026-08-28', 'Meeting online penawaran']],
    c5: [['2026-10-09', 'Call follow up oil separator']],
    c6: [['2026-10-03', 'Kunjungan ke workshop']],
    c7: [['2026-07-15', 'Call follow up filter']],
    c8: [['2026-09-30', 'Call pengenalan produk']],
  }
  const customers: Customer[] = base.map((c) => ({ ...c, acts: (ACTS[c.id] || []).map((a) => ({ date: a[0], what: a[1] })) }))
  const custBy = (name: string) => customers.find((c) => c.name === name)

  const notifs: Notif[] = []
  customers.forEach((c) => {
    if (!c.acts.some((a) => a.date.slice(0, 7) === '2026-10'))
      notifs.push({ id: uid(), roles: ['Sales'], fid: null, cid: c.id, link: '/organizations', text: 'Belum follow up bulan ini: ' + c.name, t: D(10, 15, 8, 0), read: {} })
  })

  const it = (name: string, qty: number, price = 0, sup = '', proc: Item['proc'] = null, o: Partial<Item> = {}): Item =>
    ({ id: uid(), name, qty, price, supplier: sup, proc, eta: '', pnote: '', good: 0, bad: 0, stock: 0, struck: false, ...o })
  const mk = (id: string, cust: string, date: string, analysis: string, items: Item[], status: Form['status'], x: Partial<Form> = {}): Form =>
    ({ id, cust, tech: P.Teknisi, date, analysis, note: '', items, status, conf: 'Menunggu', confNote: '', done: false, log: [], comments: [], ...x })
  const L = (f: Form, t: number, user: string, role: Role | '—', a: string, o = '', nn = '') => { f.log.push({ t, user, role, act: a, o, n: nn } as LogEntry) }
  const C = (f: Form, t: number, role: Role, text: string) => { f.comments.push({ t, role, user: P[role], text } as Comment) }
  const price = (f: Form, t: number, list: [number, string][]) =>
    f.items.forEach((i, k) => { i.price = list[k][0]; i.supplier = list[k][1]; L(f, t + k * 60000, P.Purchasing, 'Purchasing', `Isi harga — ${i.name}`, '—', rn(i.price)) })
  const submit = (f: Form, t: number) => L(f, t, P.Teknisi, 'Teknisi', 'Ubah status pengajuan', 'Draft', 'Diajukan')
  const priced = (f: Form, t: number) => L(f, t, P.Purchasing, 'Purchasing', 'Ubah status pengajuan', 'Diajukan', 'Harga Terisi')

  /* F1 diajukan */
  const f1 = mk('BD-2610-001', 'PT Sarana Sentra', '2026-10-14', 'Kompresor refrigerasi dryer Harland HRND 930 tidak mendingin. Kompresor, filter dryer dan katup ekspansi perlu diganti.', [
    it('Compressor refrigran Daikin single phase JT90GBBV1L', 1), it('Filter dryer DML 163s', 1), it('Thermostatic expansion valve Danfoss TUBE', 1), it('Hotgas by pas valve Danfoss TCHE', 1),
    it('Freon R134a', 1), it('Freon R11', 1), it('Evaporator', 1), it('Contactor LC1D25M7', 1)], 'Diajukan')
  f1.machine = { brand: 'Harland', model: 'HRND 930', serial: 'P104774453', variant: '' }
  f1.items.forEach((i) => { i.unit = 'pcs' }); f1.items[0].unit = 'set'; f1.items[0].spec = 'Type JT90GBBV1L, 220 V / 50 Hz / R134a'; f1.items[4].unit = 'tabung'; f1.items[5].unit = 'tabung'
  f1.items[1].partNo = '023Z506491'
  f1.items[3].spec = 'type: Dunfos TCHE 068U4583 / 01238\nR134a'; f1.items[7].group = 'COMPATIBLE'
  submit(f1, D(10, 14, 16, 2)); f1.items[4].stock = 3; f1.items[1].stock = 1
  C(f1, D(10, 14, 16, 10), 'Teknisi', 'Unit di lokasi, bisa dicek ulang kalau ada pertanyaan soal spesifikasi.')
  /* F2 harga terisi */
  const f2 = mk('BD-2610-002', 'PT Dunia Mega Raya', '2026-10-12', 'Panel kontrol kompresor Kaeser AS 36 perlu penggantian timer, contactor dan komponen kelistrikan.', [
    it('Timer type DZT 410909/230V', 1), it('Contactor Schneider LC1D50A 220V', 1), it('Skun Y 2,5 mm', 50), it('Skun Y 4,0 mm', 25),
    it('Push bottom type KG5-BE 102c (merah)', 1), it('Push bottom type KG5-BE 101c (hijau)', 1), it('Kabel tunggal NYAF 1,5 mm', 20)], 'Harga Terisi')
  f2.machine = { brand: 'Kaeser', model: 'AS 36', serial: '3610646 / 1995', variant: '' }
  f2.items.forEach((i) => { i.unit = 'pcs' }); f2.items[2].unit = 'pcs'; f2.items[6].unit = 'meter'
  f2.items[0].spec = 'Model No: 410909/230V/50-60 Hz'
  submit(f2, D(10, 12, 10, 0))
  const TLM = 'Toko Listrik Mandiri'
  price(f2, D(10, 13, 9, 0), [[650000, TLM], [1250000, TLM], [3500, TLM], [4500, TLM], [85000, TLM], [85000, TLM], [6500, TLM]])
  priced(f2, D(10, 13, 9, 30))
  C(f2, D(10, 13, 9, 35), 'Purchasing', 'Harga sudah terisi semua, supplier kelistrikan satu pintu.')
  notifs.push({ id: uid(), roles: ['Sales'], fid: 'BD-2610-002', text: 'Harga terisi: BD-2610-002 PT Dunia Mega Raya', t: D(10, 13, 9, 30), read: {} })
  /* F3 pengadaan, ada barang rusak */
  const CVS = 'CV Sumber Teknik Udara'
  const f3 = mk('BD-2610-003', 'PT Jati Karya', '2026-10-06', 'Bearing motor kompresor aus, filter oli tersumbat, V-belt retak.', [
    it('Bearing 6309 ZZ', 4, 185000, CVS, 'Perlu Follow Up', { good: 2, bad: 2 }),
    it('Oil filter element', 2, 420000, 'PT Filtra Indo Perkasa', 'Dibeli'),
    it('V-belt B52', 3, 95000, CVS, 'Indent', { eta: '2026-10-25', pnote: 'Stok supplier habis, indent 10 hari' }),
    it('Grease SKF LGMT 2', 1, 280000, CVS, 'In Stock', { stock: 5 }),
    it('Pressure gauge', 1, 350000, CVS, null, { struck: true })], 'Disetujui')
  submit(f3, D(10, 6, 9, 0))
  f3.items.forEach((i, k) => L(f3, D(10, 7, 9, k), P.Purchasing, 'Purchasing', `Isi harga — ${i.name}`, '—', rn(i.price)))
  priced(f3, D(10, 7, 9, 20))
  L(f3, D(10, 8, 10, 0), P.Sales, 'Sales', 'Ubah Harga — Oil filter element', rn(450000), rn(420000))
  L(f3, D(10, 8, 10, 10), P.Sales, 'Sales', 'Coret barang — Pressure gauge', 'Aktif', 'Dicoret')
  L(f3, D(10, 8, 10, 30), P.Sales, 'Sales', 'Buat Quotation v1', '—', 'Belum Dikirim')
  L(f3, D(10, 8, 11, 0), P.Sales, 'Sales', 'Kirim Quotation v1 ke rahmat@jatikarya.example', 'Belum Dikirim', 'Terkirim')
  L(f3, D(10, 9, 9, 0), P.Sales, 'Sales', 'Ubah status pengajuan', 'Harga Terisi', 'Disetujui')
  L(f3, D(10, 9, 13, 0), P.Purchasing, 'Purchasing', 'Ubah status pengadaan — Grease SKF LGMT 2', 'Belum Diproses', 'In Stock')
  L(f3, D(10, 9, 14, 0), P.Purchasing, 'Purchasing', 'Ubah status pengadaan — Bearing 6309 ZZ', 'Belum Diproses', 'Dibeli')
  L(f3, D(10, 9, 14, 5), P.Purchasing, 'Purchasing', 'Ubah status pengadaan — V-belt B52', 'Belum Diproses', 'Indent')
  L(f3, D(10, 12, 10, 0), P.Gudang, 'Gudang', 'Stock In Bearing 6309 ZZ ×2 — Baik (Supplier: CV Sumber Teknik Udara)', '', '2 Baik')
  L(f3, D(10, 12, 10, 5), P.Gudang, 'Gudang', 'Stock In Bearing 6309 ZZ ×2 — Rusak (Supplier: CV Sumber Teknik Udara)', '', '2 Rusak')
  L(f3, D(10, 12, 10, 5), 'Sistem', '—', 'Ubah status pengadaan — Bearing 6309 ZZ', 'Dibeli', 'Perlu Follow Up')
  C(f3, D(10, 12, 11, 0), 'Purchasing', 'Bearing 2 pcs diretur ke supplier, menunggu pengganti.')
  notifs.push({ id: uid(), roles: ['Purchasing'], fid: 'BD-2610-003', text: 'Barang Diterima Rusak: Bearing 6309 ZZ ×2 (BD-2610-003)', t: D(10, 12, 10, 5), read: {} })
  /* F4 siap konfirmasi */
  const f4 = mk('BD-2610-004', 'PT Mitra Kompresor Abadi', '2026-10-01', 'Coupling element aus dan seal kit bocor pada kompresor screw.', [
    it('Coupling element', 1, 2150000, CVS, 'Dibeli', { good: 1 }), it('Seal kit', 1, 1350000, CVS, 'Dibeli', { good: 1 })], 'Disetujui')
  submit(f4, D(10, 1, 9, 0)); priced(f4, D(10, 2, 9, 0))
  L(f4, D(10, 3, 9, 0), P.Sales, 'Sales', 'Ubah status pengajuan', 'Harga Terisi', 'Disetujui')
  L(f4, D(10, 9, 13, 0), P.Gudang, 'Gudang', 'Stock In Coupling element ×1 — Baik (Supplier: CV Sumber Teknik Udara)', '', '1 Baik')
  L(f4, D(10, 9, 13, 2), P.Gudang, 'Gudang', 'Stock In Seal kit ×1 — Baik (Supplier: CV Sumber Teknik Udara)', '', '1 Baik')
  notifs.push({ id: uid(), roles: ['Teknisi'], fid: 'BD-2610-004', text: 'Barang Diterima Baik: BD-2610-004, siap dikonfirmasi', t: D(10, 9, 13, 2), read: {} })
  /* F5 selesai */
  const PFI = 'PT Filtra Indo Perkasa'
  const f5 = mk('BD-2609-005', 'PT Dharma Polimetal', '2026-09-08', 'Filter element dan oil separator sudah melewati jam service.', [
    it('Filter element', 2, 780000, PFI, 'Dibeli', { good: 2 }), it('Oil separator', 1, 2900000, PFI, 'Dibeli', { good: 1 })], 'Disetujui', { conf: 'Sesuai', done: true })
  L(f5, D(9, 8, 9, 0), P.Teknisi, 'Teknisi', 'Ubah status pengajuan', 'Draft', 'Diajukan')
  L(f5, D(9, 17, 9, 0), P.Sales, 'Sales', 'Ubah status pengajuan', 'Harga Terisi', 'Disetujui')
  L(f5, D(9, 25, 15, 0), P.Teknisi, 'Teknisi', 'Ubah status konfirmasi', 'Menunggu', 'Sesuai')
  L(f5, D(9, 26, 9, 0), P.Teknisi, 'Teknisi', 'Ubah status pekerjaan', 'Dikerjakan', 'Selesai')
  /* F6 batal */
  const f6 = mk('BD-2610-006', 'PT ABC', '2026-10-02', 'Penggantian kopling, klien menunda anggaran.', [it('Coupling flexible', 1, 1800000, CVS)], 'Batal')
  L(f6, D(10, 2, 10, 0), P.Teknisi, 'Teknisi', 'Ubah status pengajuan', 'Draft', 'Diajukan')
  L(f6, D(10, 6, 16, 0), P.Sales, 'Sales', 'Ubah status pengajuan', 'Harga Terisi', 'Batal')
  const forms = [f1, f2, f3, f4, f5, f6]

  /* quotes */
  const quotes: Quote[] = []
  const mkq = (f: Form, over: Partial<QuoteVersion>) => {
    qseq++
    const c = custBy(f.cust)!
    const v: QuoteVersion = {
      ver: 1, date: D(10, 8, 10, 30), expiry: '2026-10-29', subject: `Penawaran ${f.cust}`, desc: '', owner: P.Sales, pic: c.pic, email: c.email, addr: c.addr, lead: '',
      termin: 'DP 50% setelah PO, pelunasan setelah pekerjaan selesai', estimasi: '7-14 hari kerja setelah barang diterima', catatan: '',
      status: 'Belum Dikirim', sentTo: '', cc: '', sentAt: null,
      items: act(f).map((i) => ({ iid: i.id, name: i.name, qty: i.qty, price: i.price, unit: i.unit, partNo: i.partNo, disc: 0 })), ...over,
    }
    v.status = 'Terkirim'; v.sentTo = c.email; v.sentAt = v.date + 3600000
    quotes.push({ id: 'Q' + qseq, number: qno(qseq), formId: f.id, versions: [v] })
  }
  mkq(f3, {})
  mkq(f4, { date: D(10, 3, 9, 30), expiry: '2026-10-20' })
  mkq(f5, { date: D(9, 12, 9, 0), expiry: '2026-09-30' })
  const leg = (id: string, number: string, subject: string, pic: string, email: string, p: number) =>
    quotes.push({ id, number, formId: null, versions: [{ ver: 1, date: D(9, 23, 9, 0), expiry: '2026-09-30', subject, desc: '', owner: 'Sales', pic, email, addr: '', lead: '', termin: '', estimasi: '', catatan: '', status: 'Belum Dikirim', sentTo: '', cc: '', sentAt: null, items: [{ iid: uid(), name: 'Jasa testing', qty: 1, price: p, disc: 0 }] }] })
  leg('QL1', 'Q-LIVE-001', 'Testing penawaran PT jati karya', 'Andi (HO) - Jakarta', '', 3000000)
  leg('QL2', 'Q-LIVE-002', 'testing penawaran PT ABC', 'John', '', 100000)

  return {
    version: 1,
    clock: { sim: new Date(2026, 9, 15, 16, 10).getTime(), real },
    seq: { id: n, form: 6, quote: qseq },
    forms, quotes, suppliers, customers, notifs,
  }
}
