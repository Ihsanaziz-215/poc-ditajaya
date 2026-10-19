'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'

export function OrgFilters({ total }: { total: number }) {
  const router = useRouter()
  const sp = useSearchParams()
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString())
    if (v) p.set(k, v)
    else p.delete(k)
    router.replace(`/organizations${p.size ? `?${p}` : ''}`)
  }
  return (
    <div className="tools">
      <div className="spill">
        <Icon name="search" />
        <input placeholder="Search nama customer" aria-label="Search" defaultValue={sp.get('q') ?? ''} onChange={(e) => set('q', e.target.value)} />
      </div>
      <select style={{ width: 150 }} aria-label="Filter status" value={sp.get('cs') ?? ''} onChange={(e) => set('cs', e.target.value)}>
        <option value="">Semua status</option><option>Active</option><option>Non Active</option>
      </select>
      <select style={{ width: 140 }} aria-label="Filter class" value={sp.get('cc') ?? ''} onChange={(e) => set('cc', e.target.value)}>
        <option value="">Semua class</option><option>A</option><option>B</option><option>C</option>
      </select>
      <select style={{ width: 230 }} aria-label="Filter follow up" value={sp.get('cf') ?? ''} onChange={(e) => set('cf', e.target.value)}>
        <option value="">Semua follow up</option><option value="1">Belum follow up bulan ini</option>
      </select>
      <div className="pager">Per Page <select aria-label="Per page" defaultValue="10"><option>10</option></select> 1 - {total} of {total}</div>
    </div>
  )
}
