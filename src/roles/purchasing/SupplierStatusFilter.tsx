'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SupplierStatusFilter() {
  const router = useRouter()
  const sp = useSearchParams()
  return (
    <select
      style={{ width: 150 }}
      aria-label="Filter status"
      value={sp.get('ss') ?? ''}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString())
        if (e.target.value) p.set('ss', e.target.value)
        else p.delete('ss')
        router.replace(`/suppliers${p.size ? `?${p}` : ''}`)
      }}
    >
      <option value="">Semua status</option><option>Aktif</option><option>Nonaktif</option>
    </select>
  )
}
