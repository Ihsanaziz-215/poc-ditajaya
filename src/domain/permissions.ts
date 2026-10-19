import type { Form, Role } from './types'

export const canStruct = (f: Form, role: Role) =>
  (role === 'Teknisi' && f.status === 'Draft') || (role === 'Sales' && f.status === 'Harga Terisi')
export const canPrice = (f: Form, role: Role) =>
  (role === 'Purchasing' && f.status === 'Diajukan') || (role === 'Sales' && f.status === 'Harga Terisi')
export const canSup = (f: Form, role: Role) => role === 'Purchasing' && f.status === 'Diajukan'
