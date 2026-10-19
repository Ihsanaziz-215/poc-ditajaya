'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { active, remain } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'
import { receiveAllAction } from './actions'
import { ReceiveModal } from './ReceiveModal'

export function ReceivingCard({ form: f, role, today }: { form: Form; role: Role; today: string }) {
  const { run } = useAction()
  const [open, setOpen] = useState<string | null>(null)
  if (f.status !== 'Disetujui' || role === 'Sales') return null
  const items = active(f)
  const bad = items.filter((i) => i.proc === 'Perlu Follow Up')
  const isG = role === 'Gudang' && !f.done
  const target = items.find((i) => i.id === open)
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h3>Penerimaan barang (Stock In)</h3>
          <p className="sub">Gudang mencatat barang masuk lewat fitur Stock In yang sudah ada di app. Barang In Stock tidak perlu diterima lagi. Barang rusak otomatis mengubah status pengadaan ke Perlu Follow Up.</p>
        </div>
        {isG && <button className="btn info sm" title="Pintasan demo" onClick={() => run(receiveAllAction(f.id))}>Stock In semua (Baik)</button>}
      </div>
      {bad.length > 0 && (
        <div className="banner stop">
          <Icon name="alert" />
          <div><b>Barang rusak, Purchasing sudah dinotifikasi</b>{bad.map((i) => `${i.name} ×${i.bad} · Supplier ${i.supplier}`).join('; ')}</div>
        </div>
      )}
      <div className="wrapx">
        <table className="tbl">
          <thead><tr><th>Barang</th><th>Supplier asal</th><th className="num">Dipesan</th><th className="num">Masuk baik</th><th className="num">Rusak</th><th>Status</th><th /></tr></thead>
          <tbody>
            {items.map((i) => {
              const ready = (i.proc === 'Dibeli' || i.proc === 'Indent') && remain(i) > 0
              const fromStock = i.proc === 'In Stock'
              const stt = fromStock ? 'Tidak Perlu' : i.proc === 'Perlu Follow Up' ? 'Diterima Rusak' : i.proc && i.good >= i.qty ? 'Diterima Baik' : 'Belum Diterima'
              const why = ready ? '' : fromStock ? 'Barang dari stok' : i.proc === 'Perlu Follow Up' ? 'Menunggu follow up Purchasing' : !i.proc ? 'Menunggu Purchasing mengecek barang' : 'Sudah lengkap'
              return (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.supplier || '—'}</td>
                  <td className="num">{fromStock ? '—' : i.qty}</td>
                  <td className="num">{fromStock ? '—' : i.good}</td>
                  <td className="num">{fromStock ? '—' : i.bad || 0}</td>
                  <td><Badge v={stt} /></td>
                  <td>
                    {isG && !fromStock && <button className="btn sec sm" disabled={!ready} title={why} onClick={() => setOpen(i.id)}>Stock In</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {role === 'Gudang' && <div className="hint"><Icon name="lock" />Gudang tidak bisa mengubah isi form.</div>}
      {target && <ReceiveModal fid={f.id} item={target} today={today} onClose={() => setOpen(null)} />}
    </div>
  )
}
