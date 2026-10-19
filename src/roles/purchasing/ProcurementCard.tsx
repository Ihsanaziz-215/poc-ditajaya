'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { active, canSetProc } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'
import { fd } from '@/lib/format'
import { markAllBoughtAction, resolveFollowUpAction, setProcAction, setProcInfoAction } from './actions'

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
          <p className="sub">Purchasing mengecek barang yang disetujui customer: In Stock bila sudah ada di gudang, Dibeli, atau Indent. Barang yang dicoret Sales tidak ikut.</p>
        </div>
        {!f.done && items.some((i) => !i.proc) && (
          <button className="btn info sm" disabled={pending || !canAct} title={canAct ? undefined : 'Hanya Purchasing yang bisa mengubah status pengadaan'} onClick={() => run(markAllBoughtAction(f.id))}>Tandai semua Dibeli</button>
        )}
      </div>
      <div className="wrapx">
        <table className="tbl">
          <thead><tr><th>Barang</th><th>Supplier</th><th className="num">Stok saat ini</th><th>Status</th><th>Estimasi tiba</th><th>Catatan purchasing</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={`${i.id}-${rev}`}>
                <td>{i.name}</td>
                <td>{i.supplier || '—'}</td>
                <td className="num">{i.stock || 0}{(i.stock || 0) < i.qty && <> <small style={{ color: 'var(--muted)' }}>(butuh {i.qty})</small></>}</td>
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
