import Link from 'next/link'
import { Suspense } from 'react'
import { CreateQuoteButton } from '@/components/quote/CreateQuoteButton'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { SearchInput } from '@/components/ui/SearchInput'
import { calc, isExpired, today } from '@/domain/derived'
import { fd, rp } from '@/lib/format'
import { store } from '@/server/store'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const db = await store.read()
  const t = today(db)
  const qs = (sp.q || '').toLowerCase()
  const rows = db.quotes.filter((q) => {
    const v = q.versions[q.versions.length - 1]
    return !qs || (v.subject + ' ' + q.number + ' ' + (q.formId || '')).toLowerCase().includes(qs)
  })
  return (
    <>
      <PageHead crumbs={[['Quotes']]} title="Quotes"><CreateQuoteButton /></PageHead>
      <div className="banner" style={{ marginBottom: 16 }}>
        <Icon name="info" />
        <div><b>Menu Quotes yang sudah live, ditambah flow baru dari PRD</b>Kolom Versi, Status Kirim, Kedaluwarsa, dan Form Breakdown adalah tambahan. Dua quote berlabel Q-LIVE adalah data testing yang sudah ada.</div>
      </div>
      <div className="card">
        <div className="tools">
          <Suspense><SearchInput basePath="/quotes" /></Suspense>
          <div className="pager">Per Page <select aria-label="Per page" defaultValue="10"><option>10</option></select> 1 - {rows.length} of {rows.length}</div>
        </div>
        <div className="wrapx">
          <table className="tbl">
            <thead>
              <tr>
                <th>Subject</th><th>Sales Person</th><th>Expired Quote</th><th>Person</th><th className="num">Subtotal</th><th className="num">Discount</th>
                <th className="num">Tax</th><th className="num">Grand Total</th><th>Versi</th><th>Status Kirim</th><th>Form Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const v = q.versions[q.versions.length - 1]
                const c = calc(v)
                return (
                  <tr key={q.id} className="row">
                    <td><Link href={`/quotes/${q.id}`}><b>{v.subject}</b></Link><br /><small style={{ color: 'var(--muted)' }}>{q.number}</small></td>
                    <td>{v.owner}</td>
                    <td>{fd(v.expiry)}{isExpired(v, t) && <><br /><Badge v="Kedaluwarsa" /></>}</td>
                    <td>{v.pic || '—'}</td>
                    <td className="num">{rp(c.sub)}</td><td className="num">{rp(c.disc)}</td><td className="num">{rp(c.tax)}</td><td className="num">{rp(c.grand)}</td>
                    <td>{q.formId ? <>v{v.ver}{q.versions.length > 1 && <> <small style={{ color: 'var(--muted)' }}>({q.versions.length} versi)</small></>}</> : '—'}</td>
                    <td>{q.formId ? <Badge v={v.status} /> : '—'}</td>
                    <td>{q.formId ? <Link href={`/breakdown/${q.formId}`}>{q.formId}</Link> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
