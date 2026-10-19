'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ActionResult } from '@/server/runAs'
import { Modal } from './Modal'

type Kind = 'ok' | 'info' | 'bad' | ''
interface ToastItem { id: number; msg: string; kind: Kind }
interface ConfirmOpts { title: string; text: string; okLabel: string }

interface Ctx {
  toast: (msg: string, kind?: Kind) => void
  confirm: (o: ConfirmOpts) => Promise<boolean>
}
const C = createContext<Ctx | null>(null)

export function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [ask, setAsk] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const seq = useRef(0)

  const toast = useCallback((msg: string, kind: Kind = '') => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'bad' ? 5200 : 3600)
  }, [])

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setAsk({ ...o, resolve })), [])
  const close = (v: boolean) => { ask?.resolve(v); setAsk(null) }

  return (
    <C.Provider value={{ toast, confirm }}>
      {children}
      {ask && (
        <Modal onClose={() => close(false)}>
          <h3>{ask.title}</h3>
          <p className="sub" style={{ color: 'var(--muted)' }}>{ask.text}</p>
          <div className="acts">
            <button className="btn sec" onClick={() => close(false)}>Kembali</button>
            <button className="btn" onClick={() => close(true)}>{ask.okLabel}</button>
          </div>
        </Modal>
      )}
      <div id="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}
      </div>
    </C.Provider>
  )
}

export function useUi(): Ctx {
  const c = useContext(C)
  if (!c) throw new Error('useUi must be used inside Providers')
  return c
}

/** Runs a server action, shows its toast, follows redirects, and refreshes server data. */
export function useAction() {
  const { toast } = useUi()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const run = useCallback(async (p: Promise<ActionResult>): Promise<ActionResult> => {
    setPending(true)
    try {
      const r = await p
      if (r.ok) {
        if (r.message) toast(r.message, r.kind ?? '')
        if (r.redirect) router.push(r.redirect)
      } else {
        toast(r.error, 'bad')
      }
      router.refresh()
      return r
    } finally {
      setPending(false)
    }
  }, [router, toast])
  return { run, pending }
}
