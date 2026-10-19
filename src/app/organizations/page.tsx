import Link from 'next/link'
import { Fragment, Suspense } from 'react'
import { OrgFilters } from '@/components/org/OrgFilters'
import { Badge, Tbc } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { hasFollowUp, labelOf, today } from '@/domain/derived'
import { fd } from '@/lib/format'
import { getRole } from '@/lib/role'
import { FollowUpButton } from '@/roles/sales/FollowUpButton'
import { store } from '@/server/store'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const role = await getRole()
  const db = await store.read()
  const t = today(db)
  const q = (sp.q || '').toLowerCase()
  const all = db.customers.map((c) => ({ c, l: labelOf(c, t), fu: hasFollowUp(c, t) }))
  const noFu = all.filter((x) => !x.fu).length
  const rows = all.filter(
    (x) =>
      (!q || x.c.name.toLowerCase().includes(q)) &&
      (!sp.cs || (sp.cs === 'Active') === x.l.active) &&
      (!sp.cc || x.l.cls === sp.cc) &&
      (!sp.cf || !x.fu),
  )
  const cut = labelOf(db.customers[0], t).cut
  const link = (cx: string) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])
    if (sp.cx === cx) p.delete('cx')
    else p.set('cx', cx)
    return `/organizations${p.size ? `?${p}` : ''}`
  }
  return (
    <>
      <PageHead crumbs={[['Organizations']]} title="Organizations" />
      {noFu ? (
        <div className="banner turn">
          <Icon name="alert" />
          <div>
            <b>{noFu} customer belum di-follow up bulan ini</b>Notifikasi dikirim ke Sales. Follow up dihitung dari Activities (call, meeting, kunjungan) di bulan berjalan.{' '}
            <Link href="/organizations?cf=1">Tampilkan hanya yang belum</Link>
          </div>
        </div>
      ) : (
        <div className="banner"><Icon name="info" /><div><b>Semua customer sudah di-follow up bulan ini</b></div></div>
      )}
      <div className="card">
        <Suspense><OrgFilters total={rows.length} /></Suspense>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Status</th><th>Class</th><th className="num">Total Mesin</th><th>Pembelian Terakhir</th><th>Follow Up Bulan Ini</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(({ c, l, fu }) => (
                <Fragment key={c.id}>
                  <tr className="row">
                  <td><Link href={link(c.id)}>{c.name}</Link><br /><small style={{ color: 'var(--muted)' }}>{c.pic}</small></td>
                  <td><Badge v={l.active ? 'Active' : 'Non Active'} /></td>
                  <td>{l.cls === '—' ? '—' : <span className={`b ${{ A: 'ok', B: 'info', C: 'gray' }[l.cls]}`}>Class {l.cls}</span>}</td>
                  <td className="num">{l.mesin}</td>
                  <td>{fd(l.last)}</td>
                  <td>{fu ? <span className="b ok">Sudah</span> : <span className="b bad">Belum follow up bulan ini</span>}</td>
                  <td>{!fu && role === 'Sales' ? <FollowUpButton cid={c.id} /> : '—'}</td>
                  </tr>
                  {sp.cx === c.id && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--th)' }}>
                        <div className="cols2">
                          <div>
                            <b>Riwayat pembelian (dasar Status dan Class)</b>
                            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                              {[...c.purchases].sort((a, b) => b.date.localeCompare(a.date)).map((p, k) => (
                                <li key={k}>{fd(p.date)} · {p.type === 'mesin' ? 'Mesin' : 'Sparepart'} · {p.what} × {p.qty}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <b>Activities (dasar follow up)</b>
                            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                              {[...c.acts].sort((a, b) => b.date.localeCompare(a.date)).map((a, k) => <li key={k}>{fd(a.date)} · {a.what}</li>)}
                              {!c.acts.length && <li>Belum ada activity</li>}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty">Tidak ada customer yang cocok.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="hint">
          <Icon name="info" />Aturan label: Active bila ada pembelian apa pun dalam 6 bulan terakhir (sejak {fd(cut)}). Class dari total kumulatif mesin: 1 sampai 2 = C, 3 sampai 5 = B, lebih dari 5 = A, tidak turun saat Non Active. Label tidak bisa diedit. Klik nama untuk melihat dasarnya.{' '}
          <Tbc t="Class hanya menghitung mesin, TBC di PRD." />
        </div>
      </div>
    </>
  )
}
