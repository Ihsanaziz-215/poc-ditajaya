export interface Product { name: string; partNo: string; unit: string; stock: number }

/** Data gudang (mock). Data Products asli belum tersambung. Dipakai sebagai rekomendasi di form teknisi: barang yang tidak ada di sini diisi manual. */
export const PRODUCTS: Product[] = [
  { name: 'Oil filter element', partNo: 'OF-2205', unit: 'pcs', stock: 12 },
  { name: 'Air filter element', partNo: 'AF-1109', unit: 'pcs', stock: 8 },
  { name: 'Oil separator element', partNo: 'OS-3310', unit: 'pcs', stock: 5 },
  { name: 'Filter dryer DML 163s', partNo: '023Z5013', unit: 'pcs', stock: 3 },
  { name: 'Pressure gauge', partNo: 'PG-0116', unit: 'pcs', stock: 15 },
  { name: 'Pressure switch', partNo: 'PS-2040', unit: 'pcs', stock: 6 },
  { name: 'Solenoid valve', partNo: 'SV-1207', unit: 'pcs', stock: 4 },
  { name: 'Drain valve', partNo: 'DV-0840', unit: 'pcs', stock: 9 },
  { name: 'Thermostatic valve', partNo: 'TV-4415', unit: 'pcs', stock: 2 },
  { name: 'Minimum pressure valve', partNo: 'MPV-7721', unit: 'pcs', stock: 3 },
  { name: 'V-belt', partNo: 'VB-B52', unit: 'pcs', stock: 20 },
  { name: 'Compressor oil 20L', partNo: 'CO-20L', unit: 'tabung', stock: 11 },
  { name: 'Refrigerant R404A', partNo: 'RF-404A', unit: 'tabung', stock: 7 },
  { name: 'Expansion valve', partNo: 'EV-068U2024', unit: 'pcs', stock: 4 },
  { name: 'Contactor 3 phase', partNo: 'CT-3P25', unit: 'pcs', stock: 10 },
  { name: 'Fan motor', partNo: 'FM-2208', unit: 'unit', stock: 2 },
  { name: 'Coupling', partNo: 'CP-5503', unit: 'set', stock: 5 },
  { name: 'Seal kit', partNo: 'SK-9014', unit: 'set', stock: 8 },
]

const norm = (s: string) => s.trim().toLowerCase()
export const byName = (v: string): Product | undefined => (norm(v) ? PRODUCTS.find((p) => norm(p.name) === norm(v)) : undefined)
export const byPartNo = (v: string): Product | undefined => (norm(v) && norm(v) !== '-' ? PRODUCTS.find((p) => norm(p.partNo) === norm(v)) : undefined)
