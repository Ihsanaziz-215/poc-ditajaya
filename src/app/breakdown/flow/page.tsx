import { Badge } from '@/components/ui/Badge'
import { PageHead } from '@/components/ui/PageHead'
import { FLOW } from '@/domain/flow'
import { getRole } from '@/lib/role'

export default async function Page() {
  await getRole()
  return (
    <>
      <PageHead crumbs={[['Form Breakdown', '/breakdown'], ['Alur status']]} title="Alur status Form Breakdown" />
      <div className="banner">Status hanya maju ke tahap berikutnya. Satu-satunya jalan mundur adalah jalur pengecualian dari PRD: retur barang rusak, Tidak Sesuai, dan Batal.</div>
      <div className="card">
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th>Status</th><th>Giliran</th><th>Yang dilakukan</th><th>Lanjut ke</th></tr></thead>
            <tbody>
              {FLOW.map((s) => (
                <tr key={s.status}>
                  <td>{s.status.includes('/') ? s.status : <Badge v={s.status} />}{s.exception && <small style={{ color: 'var(--muted)' }}> · pengecualian</small>}</td>
                  <td>{s.owner ?? '—'}</td>
                  <td>{s.doing}</td>
                  <td>
                    {s.next.length ? s.next.map((n) => <div key={n.to}><b>{n.to}</b> <small style={{ color: 'var(--muted)' }}>· {n.when}</small></div>) : 'Selesai'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
