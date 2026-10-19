'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { active, canSetProc, need } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'
import { fd } from '@/lib/format'
import { markAllBoughtAction, resolveFollowUpAction, setFromStockAction, setProcAction, setProcInfoAction } from './actions'

export function ProcurementCard({ form: f, role }: { form: Form; role: Role }) {
  const { run, pending } = useAction()
  const [rev, setRev] = useState(0)
  if (f.status !== 'Disetujui') return null
  const items = active(f)
  const canAct = role === 'Purchasing' && !f.done
  const after = async (p: Promise<unknown>) => { await p; setRev((r) => r + 1) }
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h3>Pengadaan</h3>
          <p className="sub">Purchasing tanya Gudang dulu, isi Dari stok bila barang sebagian atau seluruhnya sudah ada. Sisanya (Perlu dibeli) ditandai Dibeli atau Indent; kalau semua dari stok otomatis In Stock. Mur, lem, dan barang habis pakai lain cukup ditambah Sales di quotation. Barang yang dicoret Sales tidak ikut.</p>
        </div>
        {!f.done && items.some((i) => !i.proc) && (
          <button className="btn info sm" disabled={pending || !canAct} title={canAct ? undefined : 'Hanya Purchasing yang bisa mengubah status pengadaan'} onClick={() => run(markAllBoughtAction(f.id))}>Tandai semua Dibeli</button>
        )}
      </div>
      <div className="wrapx">
        <table className="tbl">
          <thead><tr><th>Barang</th><th>Supplier</th><th className="num">Qty</th><th className="num">Stok gudang</th><th className="num">Dari stok</th><th className="num">Perlu dibeli</th><th>Status</th><th>Estimasi tiba</th><th>Catatan purchasing</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={`${i.id}-${rev}`}>
                <td>{i.name}</td>
                <td>{i.supplier || '—'}</td>
                <td className="num">{i.qty}</td>
                <td className="num">{i.stock || 0}</td>
                <td className="num">
                  {canAct && i.proc !== 'Perlu Follow Up' ? (
                    <input className="q" type="number" min={0} max={i.qty} defaultValue={i.fromStock || 0} disabled={pending || i.good > 0 || i.bad > 0} aria-label="Qty dari stok" onBlur={(e) => e.target.value !== String(i.fromStock || 0) && after(run(setFromStockAction(f.id, i.id, Number(e.target.value))))} />
                  ) : i.fromStock || 0}
                </td>
                <td className="num"><b>{need(i)}</b></td>
                <td>
                  {i.proc === 'Perlu Follow Up' ? (
                    <>
                      <Badge v={i.proc} />
                      {!f.done && <> <button className="btn sec sm" disabled={pending || !canAct} title={canAct ? undefined : 'Hanya Purchasing yang bisa menyelesaikan follow up'} onClick={() => run(resolveFollowUpAction(f.id, i.id))}>Selesai follow up</button></>}
                    </>
                  ) : canAct ? (
                    <select value={i.proc ?? ''} disabled={pending || i.good > 0 || i.bad > 0} title={i.good > 0 || i.bad > 0 ? 'Barang sudah diterima Gudang, status terkunci' : undefined} aria-label="Status pengadaan" onChange={(e) => e.target.value && run(setProcAction(f.id, i.id, e.target.value as 'In Stock' | 'Dibeli' | 'Indent'))}>
                      <option value="">Pilih status</option>
                      {(['In Stock', 'Dibeli', 'Indent'] as const).map((x) => <option key={x} disabled={x !== i.proc && !canSetProc(i.proc, x)}>{x}</option>)}
                    </select>
                  ) : (
                    <Badge v={i.proc || 'Belum Diproses'} />
                  )}
                </td>
                <td>
                  {canAct && i.proc !== 'In Stock' ? (
                    <input type="date" defaultValue={i.eta} aria-label="Estimasi tiba" onBlur={(e) => e.target.value !== i.eta && after(run(setProcInfoAction(f.id, i.id, 'eta', e.target.value)))} />
                  ) : i.eta ? fd(i.eta) : '—'}
                </td>
                <td>
                  {canAct ? (
                    <input defaultValue={i.pnote} placeholder="Opsional" aria-label="Catatan" onBlur={(e) => e.target.value.trim() !== i.pnote && after(run(setProcInfoAction(f.id, i.id, 'pnote', e.target.value)))} />
                  ) : i.pnote || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hint"><Icon name="info" />Stok mengacu ke data Products (In Stock dan On Hand) di app live. Angka di prototype adalah mock.</div>
    </div>
  )
}
