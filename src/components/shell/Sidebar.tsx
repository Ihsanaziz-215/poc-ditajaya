'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export function Sidebar() {
  const path = usePathname()
  const { toast } = useUi()
  return (
    <nav className="side" aria-label="Menu utama">
      <div className="logo" style={{ marginBottom: 10, width: 40, height: 32, fontSize: 15 }}>dp</div>
      {NAV.map((n, i) =>
        n === 'hr' ? (
          <hr key={i} />
        ) : n.href ? (
          <Link key={n.label} href={n.href} data-tip={n.label} aria-label={n.label} className={path.startsWith(n.href) ? 'active' : ''}>
            <Icon name={n.icon} />
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
            <Icon name={n.icon} />
          </a>
        ),
      )}
    </nav>
  )
}
