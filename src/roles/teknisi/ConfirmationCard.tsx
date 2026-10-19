'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { allGood } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'
import { confirmItemsAction } from './actions'

export function ConfirmationCard({ form: f, role }: { form: Form; role: Role }) {
  const { run, pending } = useAction()
  const [note, setNote] = useState('')
  const [bad, setBad] = useState(false)
  if (f.status !== 'Disetujui' || !allGood(f)) return null
  const can = role === 'Teknisi' && !f.done && f.conf !== 'Sesuai'
  const go = async (res: 'Sesuai' | 'Tidak Sesuai') => {
    const r = await run(confirmItemsAction(f.id, res, note))
    setBad(!r.ok && res === 'Tidak Sesuai' && !note.trim())
    if (r.ok) setNote('')
  }
  return (
    <div className="card">
      <h3>Konfirmasi teknisi</h3>
      <p className="sub">Pastikan barang sesuai sebelum pekerjaan dimulai.</p>
      <div className="chips" style={{ marginBottom: 10 }}><div className="sg"><small>Status konfirmasi</small><Badge v={f.conf} /></div></div>
      {f.confNote && <p style={{ margin: '0 0 10px' }}><small style={{ color: 'var(--muted)' }}>Catatan teknisi</small><br />{f.confNote}</p>}
      {can && (
        <>
          <label className="l">Catatan {bad ? <span className="err">wajib untuk Tidak Sesuai</span> : '(wajib untuk Tidak Sesuai)'}</label>
          <textarea
            className={bad ? 'miss' : ''} style={{ minHeight: 64 }} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Freon yang datang R404A, form minta R134a"
          />
          <div className="acts" style={{ marginTop: 12, justifyContent: 'flex-start' }}>
            <button className="btn" style={{ background: 'var(--ok)' }} disabled={pending} onClick={() => go('Sesuai')}>Sesuai</button>
            <button className="btn danger" disabled={pending} onClick={() => go('Tidak Sesuai')}>Tidak Sesuai</button>
          </div>
          <div className="hint"><Icon name="info" />Sesuai mengaktifkan tombol kerjakan breakdown. Tidak Sesuai mengunci pekerjaan dan menotifikasi Sales dan Purchasing.</div>
        </>
      )}
    </div>
  )
}
