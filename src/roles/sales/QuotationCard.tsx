import Link from 'next/link'
import { PreviewButton, SendButton } from '@/components/quote/QuoteButtons'
import { Badge, Tbc } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { calc, isExpired } from '@/domain/derived'
import type { Form, Quote, Role } from '@/domain/types'
import { fd, rp } from '@/lib/format'
import { MakeQuoteButton } from './HeaderButtons'

export function QuotationCard({ form: f, quote: q, role, today }: { form: Form; quote?: Quote; role: Role; today: Date }) {
  if (!((f.status !== 'Draft' && f.status !== 'Batal') || q)) return null
  const canMake = f.status === 'Harga Terisi' && !q
  const isSales = role === 'Sales'
  const v = q?.versions[q.versions.length - 1]
  const common = q ? { quote: q, cust: f.cust, formId: f.id } : null
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h3>Quotation <Tbc t="Posisi quotation di alur (setelah edit harga dan qty, sebelum keputusan) adalah asumsi PRD, TBC nomor 5." /></h3>
          <p className="sub">Dibuat Sales dari data form setelah harga terisi, lalu dikirim ke customer lewat email.</p>
        </div>
        {canMake && <MakeQuoteButton fid={f.id} can={isSales} />}
      </div>
      {q && v && common ? (
        <>
          <div className="chips" style={{ marginBottom: 12 }}>
            <div className="sg"><small>Nomor</small><b>{q.number}</b></div>
            <div className="sg"><small>Versi terbaru</small><b>v{v.ver}</b></div>
            <div className="sg"><small>Status kirim</small><Badge v={v.status} />{isExpired(v, today) && <> <Badge v="Kedaluwarsa" /></>}</div>
            <div className="sg"><small>Berlaku sampai</small>{fd(v.expiry)}</div>
            <div className="sg"><small>Grand total (incl. PPN 11%)</small><b>{rp(calc(v).grand)}</b></div>
          </div>
          <div className="acts" style={{ justifyContent: 'flex-start' }}>
            <Link className="btn sec sm" href={`/quotes/${q.id}`}><Icon name="eye" />Buka quote</Link>
            <PreviewButton {...common} vi={q.versions.length - 1} expired={isExpired(v, today)} canSend={isSales} small />
            <SendButton {...common} small className="btn" can={isSales} />
          </div>
          {q.versions.length > 1 && (
            <div className="hint"><Icon name="info" />{q.versions.length} versi tersimpan: {q.versions.map((x) => `v${x.ver} (${x.status})`).join(', ')}</div>
          )}
        </>
      ) : !canMake ? (
        <div className="hint">
          <Icon name="info" />
          {f.status === 'Diajukan' ? 'Quotation bisa dibuat setelah Purchasing mengisi harga.' : role === 'Sales' ? 'Quotation belum dibuat.' : 'Quotation belum dibuat. Hanya Sales yang bisa membuat dan mengirim quotation.'}
        </div>
      ) : null}
    </div>
  )
}
