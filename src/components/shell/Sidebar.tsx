'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'
import { useUi } from '@/components/ui/Providers'

type Nav = 'hr' | { icon: IconName; label: string; href?: string }
const NAV: Nav[] = [
  { icon: 'gauge', label: 'Dashboard' },
  { icon: 'leads', label: 'Leads' },
  { icon: 'quotes', label: 'Quotes', href: '/quotes' },
  { icon: 'mail', label: 'Mail' },
  { icon: 'clip', label: 'Activities' },
  { icon: 'contact', label: 'Organizations', href: '/organizations' },
  { icon: 'box', label: 'Products' },
  'hr',
  { icon: 'flow', label: 'Form Breakdown', href: '/breakdown' },
  { icon: 'truck', label: 'Data Supplier', href: '/suppliers' },
]

const TOGGLE = 'side:toggle'

/** Hamburger di header; hanya tampil di layar kecil, membuka sidebar sebagai drawer. */
export function MenuToggle() {
  return (
    <button className="ib menu-btn" aria-label="Buka menu" onClick={() => window.dispatchEvent(new Event(TOGGLE))}>
      <Icon name="menu" />
    </button>
  )
}

export function Sidebar() {
  const path = usePathname()
  const { toast } = useUi()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    const t = () => setOpen((o) => !o)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener(TOGGLE, t)
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener(TOGGLE, t); window.removeEventListener('keydown', k) }
  }, [])
  return (
    <>
    {open && <div className="side-ov" onClick={() => setOpen(false)} />}
    <nav className={`side${open ? ' open' : ''}`} aria-label="Menu utama">
      <div className="side-head">
        <div className="logo" style={{ width: 40, height: 32, fontSize: 15 }}>dp</div>
        <button className="ib side-x" aria-label="Tutup menu" onClick={() => setOpen(false)}><Icon name="close" /></button>
      </div>
      {NAV.map((n, i) =>
        n === 'hr' ? (
          <hr key={i} />
        ) : n.href ? (
          <Link key={n.label} href={n.href} data-tip={n.label} aria-label={n.label} className={path.startsWith(n.href) ? 'active' : ''}>
            <Icon name={n.icon} /><span className="lab">{n.label}</span>
          </Link>
        ) : (
          <a
            key={n.label}
            role="button"
            tabIndex={0}
            data-tip={n.label}
            aria-label={n.label}
            onClick={() => toast(`Menu ${n.label} sudah live di app dan tidak dibuat ulang di prototype ini.`)}
            onKeyDown={(e) => { if (e.key === 'Enter') toast(`Menu ${n.label} sudah live di app dan tidak dibuat ulang di prototype ini.`) }}
          >
            <Icon name={n.icon} /><span className="lab">{n.label}</span>
          </a>
        ),
      )}
    </nav>
    </>
  )
}
