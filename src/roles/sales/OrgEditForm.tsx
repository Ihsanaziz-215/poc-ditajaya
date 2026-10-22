'use client'

import { useState } from 'react'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import type { Customer } from '@/domain/types'
import { createOrganizationAction, editOrganizationAction } from './actions'

const COUNTRIES = ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Philippines']

/** Same fields as the live Edit Organization page. Only Sales can save. */
export function OrgEditForm({ customer: c, owners, canEdit }: { customer?: Customer; owners: string[]; canEdit: boolean }) {
  const { run, pending } = useAction()
  const [v, setV] = useState({
    name: c?.name ?? '', addr: c?.addr ?? '', country: c?.country ?? 'Indonesia', city: c?.city ?? '', province: c?.province ?? '', postal: c?.postal ?? '', owner: c?.owner ?? '', pic: c?.pic ?? '', email: c?.email ?? '', phone: c?.phone ?? '',
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }))
  const ro = !canEdit
  return (
    <>
      <PageHead crumbs={[['Contacts'], ['Organizations', '/organizations'], [c ? 'Edit Organization' : 'Create Organization']]} title={c ? 'Edit Organization' : 'Create Organization'}>
        <button
          className="btn"
          disabled={pending || ro}
          title={ro ? 'Hanya Sales yang bisa membuat atau mengubah organization' : undefined}
          onClick={async () => {
            const r = await run(c ? editOrganizationAction(c.id, v) : createOrganizationAction(v))
            setErr(r.ok ? {} : r.fields ?? {})
          }}
        >
          Save Organization
        </button>
      </PageHead>
      <div className="card">
        {ro && <div className="hint" style={{ marginTop: 0 }}>Role ini hanya melihat. Hanya Sales yang bisa membuat atau mengubah organization.</div>}
        <div className="fld">
          <label className="l" htmlFor="o-name">Name <span className="req">*</span></label>
          <input id="o-name" className={err.name ? 'miss' : ''} disabled={ro} value={v.name} onChange={(e) => set('name', e.target.value)} />
          {err.name && <div className="err">{err.name}</div>}
        </div>
        <label className="l" htmlFor="o-addr" style={{ marginTop: 16 }}>Address</label>
        <div className="grid2" style={{ alignItems: 'start' }}>
          <textarea id="o-addr" disabled={ro} style={{ minHeight: 200 }} value={v.addr} onChange={(e) => set('addr', e.target.value)} />
          <div style={{ display: 'grid', gap: 12 }}>
            <select aria-label="Country" disabled={ro} value={v.country} onChange={(e) => set('country', e.target.value)}>
              {[...new Set([v.country, ...COUNTRIES].filter(Boolean))].map((x) => <option key={x}>{x}</option>)}
            </select>
            <input aria-label="City" placeholder="City" disabled={ro} value={v.city} onChange={(e) => set('city', e.target.value)} />
            <input aria-label="Province" placeholder="Province" disabled={ro} value={v.province} onChange={(e) => set('province', e.target.value)} />
            <input aria-label="Postal Code" placeholder="Postal Code" disabled={ro} value={v.postal} onChange={(e) => set('postal', e.target.value)} />
          </div>
        </div>
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="fld">
            <label className="l" htmlFor="o-pic">PIC (perusahaan)</label>
            <input id="o-pic" disabled={ro} value={v.pic} onChange={(e) => set('pic', e.target.value)} />
          </div>
          <div className="fld">
            <label className="l" htmlFor="o-phone">No. Telp</label>
            <input id="o-phone" type="tel" disabled={ro} value={v.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="fld">
            <label className="l" htmlFor="o-email">Email</label>
            <input id="o-email" type="email" className={err.email ? 'miss' : ''} disabled={ro} value={v.email} onChange={(e) => set('email', e.target.value)} />
            {err.email && <div className="err">{err.email}</div>}
          </div>
        </div>
        <div className="hint">PIC dan email otomatis terisi di quotation (Up. dan tujuan kirim). Semua form breakdown customer ini menampilkan kontak ini.</div>
        <div className="fld" style={{ marginTop: 16 }}>
          <label className="l" htmlFor="o-owner">Sales Owner</label>
          <select id="o-owner" disabled={ro} value={v.owner} onChange={(e) => set('owner', e.target.value)}>
            <option value="">—</option>
            {[...new Set([...owners, v.owner].filter(Boolean))].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </div>
    </>
  )
}
