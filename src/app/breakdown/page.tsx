import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { ListFilters } from '@/components/breakdown/ListFilters'
import { filterForms } from '@/domain/listing'
import { isExpired, statusOf, today, total, turnOf } from '@/domain/derived'
import { fd, rp } from '@/lib/format'
import { getRole } from '@/lib/role'
import { store } from '@/server/store'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const role = await getRole()
  const db = await store.read()
  const t = today(db)
  const rows = filterForms(db.forms, { q: sp.q, status: sp.lst })
  return (
    <>
      <PageHead crumbs={[['Form Breakdown']]} title="Form Breakdown">
        {role === 'Teknisi' ? (
          <Link className="btn" href="/breakdown/new"><Icon name="plus" />Buat Form</Link>
        ) : (
          <button className="btn" disabled title="Form baru hanya dibuat oleh Teknisi"><Icon name="plus" />Buat Form</button>
        )}
      </PageHead>
      <div className="card">
        <Suspense>
          <ListFilters total={rows.length} />
        </Suspense>
        <div className="wrapx">
          <table className="tbl">
            <thead>
              <tr>
                <th>No. Form</th><th>Customer</th><th>Teknisi</th><th>Tanggal Analisa</th><th>Status</th>
                <th className="num">Total Harga</th><th>Quotation</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const q = db.quotes.find((x) => x.formId === f.id)
                const v = q?.versions[q.versions.length - 1]
                const turn = turnOf(f)
                const mine = turn?.role === role
                return (
                  <tr key={f.id} className="row">
                    <td><Link href={`/breakdown/${f.id}`}>{f.id}</Link></td>
                    <td>{f.cust}</td>
                    <td>{f.tech}</td>
                    <td>{fd(f.date)}</td>
                    <td><Badge v={statusOf(f)} /></td>
                    <td className="num">{total(f) ? rp(total(f)) : '—'}</td>
                    <td>
                      {v ? (
                        <>v{v.ver} <Badge v={v.status} />{isExpired(v, t) && <> <Badge v="Kedaluwarsa" /></>}</>
                      ) : '—'}
                    </td>
                    <td>
                      {mine ? (
                        <Link className="btn sm" href={`/breakdown/${f.id}`} title={turn.text}><Icon name="pen" />{turn.action}</Link>
                      ) : (
                        <button className="btn sm" disabled title={turn ? `Giliran ${turn.role}` : 'Form sudah selesai atau dibatalkan'}><Icon name="pen" />{turn?.action ?? statusOf(f)}</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr><td colSpan={8} className="empty">Tidak ada form yang cocok dengan filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
