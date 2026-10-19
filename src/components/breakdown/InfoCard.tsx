import { fd } from '@/lib/format'
import type { Form } from '@/domain/types'

export function InfoCard({ form: f }: { form: Form }) {
  return (
    <div className="card">
      <div className="kv">
        <div><small>Customer</small>{f.cust}</div>
        <div><small>Teknisi</small>{f.tech}</div>
        <div><small>Tanggal analisa</small>{fd(f.date)}</div>
        {f.analysis && <div className="w"><small>Hasil analisa</small>{f.analysis}</div>}
        {f.note && <div className="w"><small>Catatan</small>{f.note}</div>}
      </div>
    </div>
  )
}
