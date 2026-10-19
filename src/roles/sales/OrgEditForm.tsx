'use client'

import { useState } from 'react'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import type { Customer } from '@/domain/types'
import { editOrganizationAction } from './actions'

const COUNTRIES = ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Philippines']

/** Same fields as the live Edit Organization page. Only Sales can save. */
export function OrgEditForm({ customer: c, owners, canEdit }: { customer: Customer; owners: string[]; canEdit: boolean }) {
  const { run, pending } = useAction()
  const [v, setV] = useState({
    name: c.name, addr: c.addr, country: c.country ?? 'Indonesia', city: c.city ?? '', province: c.province ?? '', postal: c.postal ?? '', owner: c.owner ?? '',
  })
  const [err, setErr] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }))
  const ro = !canEdit
  return (
    <>
      <PageHead crumbs={[['Contacts'], ['Organizations', '/organizations'], ['Edit Organization']]} title="Edit Organization">
        <button
          className="btn"
          disabled={pending || ro}
          title={ro ? 'Hanya Sales yang bisa mengubah organization' : undefined}
          onClick={async () => {
            const r = await run(editOrganizationAction(c.id, v))
            setErr(r.ok ? {} : r.fields ?? {})
          }}
        >
          Save Organization
        </button>
      </PageHead>
      <div className="card">
        {ro && <div className="hint" style={{ marginTop: 0 }}>Role ini hanya melihat. Hanya Sales yang bisa mengubah organization.</div>}
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
