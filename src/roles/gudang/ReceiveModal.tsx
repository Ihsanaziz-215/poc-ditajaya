'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useAction } from '@/components/ui/Providers'
import { remain } from '@/domain/derived'
import type { Item } from '@/domain/types'
import { receiveAction } from './actions'

export function ReceiveModal({ fid, item, today, onClose }: { fid: string; item: Item; today: string; onClose: () => void }) {
  const { run, pending } = useAction()
  const [date, setDate] = useState(today)
  const [qty, setQty] = useState(remain(item))
  const [cond, setCond] = useState<'Baik' | 'Rusak'>('Baik')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  return (
    <Modal onClose={onClose}>
      <h3>Stock In</h3>
      <p className="sub" style={{ color: 'var(--muted)' }}>{item.name} · Supplier {item.supplier} · sisa {remain(item)} dari {item.qty}</p>
      <div className="grid2">
        <div><label className="l">Tanggal terima <span className="req">*</span></label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="l">Qty diterima <span className="req">*</span></label><input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
        <div className="fld full">
          <label className="l">Kondisi <span className="req">*</span></label>
          <select value={cond} onChange={(e) => setCond(e.target.value as 'Baik' | 'Rusak')}><option>Baik</option><option>Rusak</option></select>
        </div>
        <div className="fld full"><label className="l">Catatan</label><textarea style={{ minHeight: 60 }} value={note} onChange={(e) => setNote(e.target.value)} /></div>
      </div>
      <div className="hint"><Icon name="info" />Pilih Rusak: status pengadaan otomatis jadi Perlu Follow Up dan Purchasing dinotifikasi. Baik: On Hand produk bertambah. Placeholder fitur Stock In app live, tampilan final mengikuti app.</div>
      <div className="err">{err}</div>
      <div className="acts">
        <button className="btn sec" onClick={onClose}>Batal</button>
        <button
          className="btn"
          disabled={pending}
          onClick={async () => {
            const r = await run(receiveAction(fid, item.id, { date, qty, cond, note }))
            if (r.ok) onClose()
            else setErr(r.error)
          }}
        >
          Simpan Stock In
        </button>
      </div>
    </Modal>
  )
}
