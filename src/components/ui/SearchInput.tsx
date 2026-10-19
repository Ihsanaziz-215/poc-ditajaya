'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from './Icon'

export function SearchInput({ basePath, param = 'q', placeholder = 'Search' }: { basePath: string; param?: string; placeholder?: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  return (
    <div className="spill">
      <Icon name="search" />
      <input
        placeholder={placeholder}
        aria-label="Search"
        defaultValue={sp.get(param) ?? ''}
        onChange={(e) => {
          const p = new URLSearchParams(sp.toString())
          if (e.target.value) p.set(param, e.target.value)
          else p.delete(param)
          router.replace(`${basePath}${p.size ? `?${p}` : ''}`)
        }}
      />
    </div>
  )
}
