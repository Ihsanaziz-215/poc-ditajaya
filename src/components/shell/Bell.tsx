'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import type { Role } from '@/domain/types'
import { fdt } from '@/lib/format'
import { markAllNotifsReadAction, markNotifReadAction } from '@/server/actions/app'

export interface BellNotif { id: string; text: string; t: number; unread: boolean; href: string }

export function Bell({ role, notifs, unreadCount }: { role: Role; notifs: BellNotif[]; unreadCount: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { run } = useAction()
  const router = useRouter()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  return (
    <div className="bellwrap" ref={ref}>
      <button className="ib" aria-label="Notifikasi" onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
      </button>
      {open && (
        <div className="pop">
          <h4>
            Notifikasi {role}{' '}
            <a style={{ fontWeight: 500, fontSize: 13 }} onClick={() => run(markAllNotifsReadAction())}>Tandai dibaca</a>
          </h4>
          {notifs.length ? (
            notifs.map((n) => (
              <div
                key={n.id}
                className={`it ${n.unread ? 'un' : ''}`}
                onClick={async () => {
                  await run(markNotifReadAction(n.id))
                  setOpen(false)
                  router.push(n.href)
                }}
              >
                {n.text}<br /><small>{fdt(n.t)}</small>
              </div>
            ))
          ) : (
            <div className="empty">Belum ada notifikasi.</div>
          )}
          <div className="it" style={{ cursor: 'default' }}>
            <small>Channel notifikasi masih TBC (in app, email, atau WhatsApp).</small>
          </div>
        </div>
      )}
    </div>
  )
}
