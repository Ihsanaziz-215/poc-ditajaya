import Link from 'next/link'
import { PreviewButton, SendButton } from '@/components/quote/QuoteButtons'
import { SaveButton } from '@/components/quote/SaveButton'
import { QuoteEditor } from '@/components/quote/QuoteEditor'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { isExpired, today } from '@/domain/derived'
import { PERSON } from '@/domain/types'
import { fdt } from '@/lib/format'
import { getRole } from '@/lib/role'
import { store } from '@/server/store'

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params
  const sp = await searchParams
  const role = await getRole()
  const db = await store.read()
  const q = db.quotes.find((x) => x.id === id)
  if (!q) return <PageHead crumbs={[['Quotes', '/quotes'], ['Tidak ditemukan']]} title="Quote tidak ditemukan" />
  const t = today(db)
  const lastIdx = q.versions.length - 1
  const asked = Number(sp.v)
  const idx = Number.isInteger(asked) && asked >= 0 && asked <= lastIdx && sp.v !== undefined ? asked : lastIdx
  const v = q.versions[idx]
  const isLast = idx === lastIdx
  const editable = role === 'Sales' && isLast
  const tab = sp.tab === 'items' ? 'items' : 'info'
  const f = q.formId ? db.forms.find((x) => x.id === q.formId) : undefined
  const cust = f?.cust ?? null
  const expired = isExpired(v, t)
  const owners = [...new Set([PERSON.Sales, 'Sales', v.owner])]
  const base = `/quotes/${q.id}`
  const common = { quote: q, cust, formId: q.formId }
  const sentLocked = editable && v.status === 'Terkirim'
  return (
    <>
      <PageHead crumbs={[['Quotes', '/quotes'], [q.number]]} title={`Quote ${v.subject}`}>
        <PreviewButton {...common} vi={idx} expired={expired} canSend={role === 'Sales'} />
        {role === 'Sales' && isLast && <SendButton {...common} />}
        {editable && <SaveButton />}
      </PageHead>
      <div className="card" style={{ padding: '12px 20px' }}>
        <div className="vers">
          <b style={{ marginRight: 6 }}>Versi</b>
          {q.versions.map((x, k) => (
            <Link key={k} className={`vb ${k === idx ? 'on' : ''}`} href={`${base}${k === lastIdx ? '' : `?v=${k}`}${tab === 'items' ? `${k === lastIdx ? '?' : '&'}tab=items` : ''}`}>v{x.ver}</Link>
          ))}
          <span style={{ marginLeft: 8 }}><Badge v={v.status} />{expired && <> <Badge v="Kedaluwarsa" /></>}</span>
          {f && <span style={{ marginLeft: 'auto' }}>Dibuat dari <Link href={`/breakdown/${f.id}`}>{f.id}</Link></span>}
        </div>
      </div>
      {!isLast ? (
        <div className="banner"><Icon name="lock" /><div><b>Versi lama, hanya bisa dilihat</b>Versi terbaru adalah v{q.versions[lastIdx].ver}.</div></div>
      ) : role !== 'Sales' ? (
        <div className="banner"><Icon name="lock" /><div><b>Hanya Sales yang bisa membuat dan mengirim quotation</b>Role {role} bisa melihat dokumen dan riwayatnya.</div></div>
      ) : sentLocked ? (
        <div className="banner turn"><Icon name="info" /><div><b>Versi ini sudah terkirim</b>Perubahan apa pun disimpan sebagai v{v.ver + 1}. Versi {v.ver} tetap tersimpan.</div></div>
      ) : null}
      <div className="card">
        <div className="tabs">
          <Link className={`tab ${tab === 'info' ? 'on' : ''}`} href={`${base}${isLast ? '' : `?v=${idx}`}`}>Quote Information</Link>
          <Link className={`tab ${tab === 'items' ? 'on' : ''}`} href={`${base}${isLast ? '?' : `?v=${idx}&`}tab=items`}>Quote Items</Link>
        </div>
        <QuoteEditor quote={q} vi={idx} tab={tab} editable={editable} owners={owners} formId={q.formId} />
      </div>
      <div className="card">
        <h3>Riwayat versi dan pengiriman</h3>
        <p className="sub">Versi lama tetap tersimpan. Setiap pembuatan versi dan pengiriman juga tercatat di log Form Breakdown.</p>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th>Versi</th><th>Dibuat</th><th>Status kirim</th><th>Tujuan</th><th>Waktu kirim</th><th /></tr></thead>
            <tbody>
              {q.versions.map((x, k) => (
                <tr key={k}>
                  <td><b>v{x.ver}</b>{k === lastIdx && <> <span className="b pri">terbaru</span></>}</td>
                  <td>{fdt(x.date)}</td>
                  <td><Badge v={x.status} />{isExpired(x, t) && <> <Badge v="Kedaluwarsa" /></>}</td>
                  <td>{x.sentTo || '—'}{x.cc && <><br /><small style={{ color: 'var(--muted)' }}>CC {x.cc}</small></>}</td>
                  <td>{x.sentAt ? fdt(x.sentAt) : '—'}</td>
                  <td>
                    <Link className="btn sec sm" href={k === lastIdx ? base : `${base}?v=${k}`}>Lihat</Link>{' '}
                    <PreviewButton {...common} vi={k} expired={isExpired(x, t)} canSend={role === 'Sales'} small />
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
