import Link from 'next/link'
import { Suspense } from 'react'
import { Badge, RoleBadge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { ListFilters } from '@/components/breakdown/ListFilters'
import { filterForms } from '@/domain/listing'
import { isExpired, procOf, recvOf, today, total, turnOf } from '@/domain/derived'
import { fd, rp } from '@/lib/format'
import { getRole } from '@/lib/role'
import { store } from '@/server/store'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const role = await getRole()
  const db = await store.read()
  const t = today(db)
  const rows = filterForms(db.forms, { q: sp.q, status: sp.lst, mine: sp.mine === '1' }, role)
  const mineN = db.forms.filter((f) => turnOf(f)?.role === role).length
  return (
    <>
      <PageHead crumbs={[['Form Breakdown']]} title="Form Breakdown">
        <Link className="btn" href="/breakdown/new" title={role !== 'Teknisi' ? 'Form baru hanya dibuat oleh Teknisi' : undefined}>
          <Icon name="plus" />Buat Form
        </Link>
      </PageHead>
      <div className="card">
        <Suspense>
          <ListFilters role={role} mineCount={mineN} total={rows.length} />
        </Suspense>
        <div className="wrapx">
          <table className="tbl">
            <thead>
              <tr>
                <th>No. Form</th><th>Customer</th><th>Teknisi</th><th>Tanggal Analisa</th><th>Pengajuan</th><th>Pengadaan</th>
                <th>Penerimaan</th>
                <th>Konfirmasi</th><th>Giliran</th><th className="num">Total Harga</th><th>Quotation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const q = db.quotes.find((x) => x.formId === f.id)
                const v = q?.versions[q.versions.length - 1]
                const turn = turnOf(f)
                const pre = ['Batal', 'Draft', 'Diajukan', 'Harga Terisi'].includes(f.status)
                return (
                  <tr key={f.id} className="row">
                    <td><Link href={`/breakdown/${f.id}`}>{f.id}</Link></td>
                    <td>{f.cust}</td>
                    <td>{f.tech}</td>
                    <td>{fd(f.date)}</td>
                    <td><Badge v={f.done ? 'Selesai' : f.status} /></td>
                    <td><Badge v={procOf(f)} /></td>
                    <td><Badge v={recvOf(f)} /></td>
                    <td><Badge v={pre ? '—' : f.conf} /></td>
                    <td>{turn ? <RoleBadge r={turn.role} /> : <span className="b gray">—</span>}</td>
                    <td className="num">{total(f) ? rp(total(f)) : '—'}</td>
                    <td>
                      {v ? (
                        <>v{v.ver} <Badge v={v.status} />{isExpired(v, t) && <> <Badge v="Kedaluwarsa" /></>}</>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr><td colSpan={11} className="empty">Tidak ada form yang cocok dengan filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
