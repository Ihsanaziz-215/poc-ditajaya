'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { LIST_STATUSES } from '@/domain/derived'

export function ListFilters({ total }: { total: number }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [showFilter, setShowFilter] = useState(!!sp.get('lst'))
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString())
    if (v) p.set(k, v)
    else p.delete(k)
    router.replace(`/breakdown${p.size ? `?${p}` : ''}`)
  }
  return (
    <>
      <div className="tools">
        <div className="spill">
          <Icon name="search" />
          <input placeholder="Search" aria-label="Search" defaultValue={sp.get('q') ?? ''} onChange={(e) => set('q', e.target.value)} />
        </div>
        <button className="btn info" onClick={() => setShowFilter((s) => !s)}>Filter</button>
        <div className="pager">Per Page <select aria-label="Per page" defaultValue="10"><option>10</option></select> 1 - {total} of {total}</div>
      </div>
      {showFilter && (
        <div className="filt">
          <div>
            <label className="l">Status</label>
            <select value={sp.get('lst') ?? ''} onChange={(e) => set('lst', e.target.value)}>
              <option value="">Semua</option>
              {LIST_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}
    </>
  )
}
