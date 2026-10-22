import { fd } from '@/lib/format'
import type { Customer, Form } from '@/domain/types'

export function InfoCard({ form: f, customer: c }: { form: Form; customer?: Customer }) {
  return (
    <div className="card">
      <div className="kv">
        <div><small>Customer</small>{f.cust}</div>
        {c?.pic && <div><small>PIC customer</small>{c.pic}</div>}
        {c?.phone && <div><small>No. Telp</small>{c.phone}</div>}
        {c?.email && <div><small>Email</small>{c.email}</div>}
        <div><small>Teknisi</small>{f.tech}</div>
        <div><small>Tanggal analisa</small>{fd(f.date)}</div>
        {f.analysis && <div className="w"><small>Hasil analisa</small>{f.analysis}</div>}
        {f.note && <div className="w"><small>Catatan</small>{f.note}</div>}
      </div>
    </div>
  )
}
