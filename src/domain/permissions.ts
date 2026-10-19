import type { Form, Item, Role } from './types'

export const canStruct = (f: Form, role: Role) =>
  (role === 'Teknisi' && f.status === 'Draft') || (role === 'Sales' && f.status === 'Harga Terisi')
export const canPrice = (f: Form, role: Role) =>
  (role === 'Purchasing' && f.status === 'Diajukan') || (role === 'Sales' && f.status === 'Harga Terisi')
export const canSup = (f: Form, role: Role) => role === 'Purchasing' && f.status === 'Diajukan'
/** Setelah Disetujui, Purchasing boleh mengisi atau mengganti supplier saat pengadaan (barang tambahan Sales belum punya supplier), selama belum diterima Gudang. */
export const canSupItem = (f: Form, role: Role, it: Item) =>
  canSup(f, role) ||
  (role === 'Purchasing' && f.status === 'Disetujui' && !f.done && !it.struck && !(it.good > 0) && !(it.bad > 0))
