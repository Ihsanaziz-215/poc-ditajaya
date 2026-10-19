'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { PERSON } from '@/domain/types'
import type { Role } from '@/domain/types'
import { logoutAction } from '@/server/actions/app'

export function ProfileMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { run, pending } = useAction()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('click', h)
      document.removeEventListener('keydown', k)
    }
  }, [])

  return (
    <div className="bellwrap" ref={ref}>
      <button className="avatar" style={{ border: 0, cursor: 'pointer' }} aria-label="Profil" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {PERSON[role][0]}
      </button>
      {open && (
        <div className="pop" role="menu" style={{ width: 220 }}>
          <h4 style={{ display: 'block' }}>
            {PERSON[role]}
            <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>{role}</div>
          </h4>
          <button
            className="it"
            role="menuitem"
            disabled={pending}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', borderBottom: 0 }}
            onClick={() => run(logoutAction())}
          >
            <Icon name="logout" style={{ width: 16, height: 16 }} />Keluar
          </button>
        </div>
      )}
    </div>
  )
}
