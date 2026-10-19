export type Role = 'Teknisi' | 'Purchasing' | 'Sales' | 'Gudang'
export const ROLES: Role[] = ['Teknisi', 'Purchasing', 'Sales', 'Gudang']
export const PERSON: Record<Role, string> = { Teknisi: 'Ari Dwi', Purchasing: 'Sari', Sales: 'Rully', Gudang: 'Joko' }

export type FormStatus = 'Draft' | 'Diajukan' | 'Harga Terisi' | 'Disetujui' | 'Batal'
export type ProcStatus = 'In Stock' | 'Dibeli' | 'Indent' | 'Perlu Follow Up'
export type Confirmation = 'Menunggu' | 'Sesuai' | 'Tidak Sesuai'
export type SendStatus = 'Belum Dikirim' | 'Terkirim' | 'Gagal Kirim'

export interface Machine { brand: string; model: string; serial: string; variant: string }
export type MachineField = keyof Machine

export interface Item {
  id: string
  name: string
  qty: number
  price: number
  supplier: string
  proc: ProcStatus | null
  eta: string
  pnote: string
  good: number
  bad: number
  stock: number
  struck: boolean
  /** Satuan (pcs, set, meter, lot, ...), Part No dan spesifikasi tambahan dari form teknisi. */
  unit?: string
  partNo?: string
  spec?: string
}

export interface LogEntry { t: number; user: string; role: Role | '—'; act: string; o: string; n: string }
export interface Comment { t: number; role: Role; user: string; text: string }

export interface Form {
  id: string
  cust: string
  tech: string
  date: string
  analysis: string
  note: string
  /** Data mesin dari form kertas teknisi: merk, model, SN/tahun, varian (connection). */
  machine?: Machine
  items: Item[]
  status: FormStatus
  conf: Confirmation
  confNote: string
  done: boolean
  log: LogEntry[]
  comments: Comment[]
}

export interface Notif {
  id: string
  roles: Role[]
  fid: string | null
  cid?: string
  link?: string
  text: string
  t: number
  read: Partial<Record<Role, boolean>>
}

export interface Supplier { id: string; name: string; contact: string; cats: string[]; active: boolean }

export interface Customer {
  id: string
  name: string
  pic: string
  email: string
  addr: string
  purchases: { date: string; type: 'mesin' | 'sparepart'; what: string; qty: number }[]
  acts: { date: string; what: string }[]
}

export interface QuoteItem { iid: string; name: string; qty: number; price: number; disc: number; unit?: string; partNo?: string }

export interface QuoteVersion {
  ver: number
  date: number
  expiry: string
  subject: string
  desc: string
  owner: string
  pic: string
  email: string
  addr: string
  lead: string
  termin: string
  estimasi: string
  catatan: string
  status: SendStatus
  sentTo: string
  cc: string
  sentAt: number | null
  items: QuoteItem[]
}

export interface Quote { id: string; number: string; formId: string | null; versions: QuoteVersion[] }

export interface Db {
  version: 1
  clock: { sim: number; real: number }
  seq: { id: number; form: number; quote: number }
  forms: Form[]
  quotes: Quote[]
  suppliers: Supplier[]
  customers: Customer[]
  notifs: Notif[]
}
