'use client'

import { useEffect } from 'react'

export function Modal({ children, wide, onClose }: { children: React.ReactNode; wide?: boolean; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`mod${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">{children}</div>
    </div>
  )
}
