'use client'

import { Fragment, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useAction, useUi } from '@/components/ui/Providers'
import { active, total } from '@/domain/derived'
import type { Form, Role } from '@/domain/types'
import { rp } from '@/lib/format'
import { addItemAction, deleteItemAction, editItemAction, setStrikeAction } from '@/server/actions/shared'
import { useFormUi } from './FormUi'

export interface ItemsPerm { struct: boolean; price: boolean; sup: boolean }

export function ItemsCard({ form: f, role, perm, suppliers }: { form: Form; role: Role; perm: ItemsPerm; suppliers: { name: string; active: boolean }[] }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  const { missing } = useFormUi()
  const [rev, setRev] = useState(0)
  const [nn, setNn] = useState('')
  const [nq, setNq] = useState(1)
  const [nu, setNu] = useState('')
  const nStr = f.items.filter((i) => i.struck).length
  const tot = total(f)

  const edit = async (iid: string, field: 'name' | 'qty' | 'price' | 'supplier' | 'unit' | 'partNo' | 'spec', value: string) => {
    await run(editItemAction(f.id, iid, field, value))
    setRev((r) => r + 1)
  }
  const { struct: cs, price: cp, sup: csu } = perm
  // the stages where someone can restructure the list (Teknisi on Draft, Sales on Harga Terisi); everyone else sees the actions disabled
  const open = f.status === 'Draft' || f.status === 'Harga Terisi'

  const lockHint = !cs && !cp ? (
    <div className="hint"><Icon name="lock" />Isi form terkunci untuk {role} di tahap ini. {f.status === 'Draft' ? '' : 'Setiap perubahan oleh role berwenang tercatat di log.'}</div>
  ) : cp && !cs ? (
    <div className="hint"><Icon name="info" />{role === 'Purchasing' ? 'Purchasing hanya mengisi harga dan supplier. Nama dan qty barang tidak bisa diubah.' : ''}</div>
  ) : null

  return (
    <div className="card">
      <div className="ch">
        <div>
          <h3>Daftar barang</h3>
          <p className="sub">{active(f).length} barang aktif{nStr ? ` · ${nStr} dicoret Sales` : ''}{tot ? ` · total ${rp(tot)}` : ''}</p>
        </div>
      </div>
      <div className="wrapx">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 44 }}>No</th><th>Nama barang</th><th>Part No</th><th className="num">Qty</th><th>Satuan</th><th className="num">Harga</th><th>Supplier</th><th className="num">Total</th>
              {open && <th />}
            </tr>
          </thead>
          <tbody>
            {f.items.map((i, k) => {
              const x = i.struck
              const head = i.group && i.group !== (f.items[k - 1]?.group ?? '') ? i.group : ''
              return (
                <Fragment key={`${i.id}-${rev}`}>
                {head && (
                  <tr style={{ background: 'var(--warn-soft)' }}><td colSpan={cs ? 9 : 8} style={{ textAlign: 'center', fontWeight: 600 }}>{head}</td></tr>
                )}
                <tr style={x ? { opacity: 0.65 } : undefined}>
                  <td>{k + 1}</td>
                  <td>
                    {cs && !x ? (
                      <input defaultValue={i.name} aria-label="Nama barang" onBlur={(e) => e.target.value !== i.name && edit(i.id, 'name', e.target.value)} />
                    ) : x ? <><s>{i.name}</s> <span className="b gray">Dicoret</span></> : i.name}
                    {cs && !x ? (
                      <textarea defaultValue={i.spec ?? ''} rows={1} placeholder="Baris tambahan (opsional)" aria-label="Spesifikasi" style={{ marginTop: 4, fontSize: 12, minHeight: 34 }} onBlur={(e) => e.target.value.trim() !== (i.spec ?? '') && edit(i.id, 'spec', e.target.value)} />
                    ) : i.spec ? <div style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'pre-line' }}>{i.spec}</div> : null}
                  </td>
                  <td>
                    {cs && !x ? (
                      <input defaultValue={i.partNo ?? ''} placeholder="-" aria-label="Part No" style={{ width: 110 }} onBlur={(e) => e.target.value.trim() !== (i.partNo ?? '') && edit(i.id, 'partNo', e.target.value)} />
                    ) : i.partNo || '—'}
                  </td>
                  <td className="num">
                    {cs && !x ? (
                      <input className="q" type="number" min={1} defaultValue={i.qty} aria-label="Qty" onBlur={(e) => e.target.value !== String(i.qty) && edit(i.id, 'qty', e.target.value)} />
                    ) : x ? <s>{i.qty}</s> : i.qty}
                  </td>
                  <td>
                    {cs && !x ? (
                      <input list="units" defaultValue={i.unit ?? ''} placeholder="pcs" aria-label="Satuan" style={{ width: 80 }} onBlur={(e) => e.target.value.trim() !== (i.unit ?? '') && edit(i.id, 'unit', e.target.value)} />
                    ) : i.unit || '—'}
                  </td>
                  <td className="num">
                    {cp && !x ? (
                      <input
                        className={`p ${missing.has(`item:${i.id}`) && !(i.price > 0) ? 'miss' : ''}`}
                        type="number" min={0} defaultValue={i.price || ''} placeholder="0" aria-label="Harga"
                        onBlur={(e) => e.target.value !== String(i.price || '') && edit(i.id, 'price', e.target.value)}
                      />
                    ) : i.price ? (x ? <s>{rp(i.price)}</s> : rp(i.price)) : '—'}
                  </td>
                  <td>
                    {csu && !x ? (
                      <select
                        className={missing.has(`item:${i.id}`) && !i.supplier ? 'miss' : ''}
                        defaultValue={i.supplier} aria-label="Supplier"
                        onChange={(e) => edit(i.id, 'supplier', e.target.value)}
                      >
                        <option value="">Pilih supplier</option>
                        {suppliers.filter((s) => s.active || s.name === i.supplier).map((s) => <option key={s.name}>{s.name}</option>)}
                      </select>
                    ) : i.supplier || '—'}
                  </td>
                  <td className="num">{i.price && !x ? rp(i.price * i.qty) : '—'}</td>
                  {open && (
                    <td>
                      {f.status === 'Harga Terisi' ? (
                        <button className="btn sec sm" disabled={pending || !cs} title={cs ? undefined : 'Hanya Sales yang bisa mencoret barang'} onClick={() => run(setStrikeAction(f.id, i.id, !x))}>{x ? 'Batal coret' : 'Coret'}</button>
                      ) : (
                        <button
                          className="btn sec sm"
                          aria-label="Hapus barang"
                          disabled={pending || !cs}
                          title={cs ? undefined : 'Hanya Teknisi yang bisa menghapus barang'}
                          onClick={async () => {
                            if (await confirm({ title: 'Hapus barang?', text: `${i.name} akan dihapus dari form. Penghapusan tercatat di log perubahan.`, okLabel: 'Hapus' })) await run(deleteItemAction(f.id, i.id))
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="addrow">
          <input className="n" placeholder="Tambah barang: nama" aria-label="Nama barang baru" disabled={!cs} value={nn} onChange={(e) => setNn(e.target.value)} />
          <input className="q" type="number" min={1} aria-label="Qty barang baru" disabled={!cs} value={nq} onChange={(e) => setNq(Number(e.target.value))} />
          <input list="units" placeholder="Satuan" aria-label="Satuan barang baru" style={{ width: 90 }} disabled={!cs} value={nu} onChange={(e) => setNu(e.target.value)} />
          <button
            className="btn info sm"
            disabled={pending || !cs}
            title={cs ? undefined : 'Hanya Teknisi (Draft) atau Sales (Harga Terisi) yang bisa menambah barang'}
            onClick={async () => {
              const r = await run(addItemAction(f.id, { name: nn, qty: nq, unit: nu }))
              if (r.ok) { setNn(''); setNq(1); setNu('') }
            }}
          >
            <Icon name="plus" />Tambah
          </button>
        </div>
      )}
      <datalist id="units">{['pcs', 'set', 'unit', 'lot', 'meter', 'tabung', 'kg', 'liter', 'roll'].map((u) => <option key={u} value={u} />)}</datalist>
      {lockHint}
      {role === 'Sales' && f.status === 'Harga Terisi' && (
        <div className="hint"><Icon name="info" />Barang yang tidak dibutuhkan customer dicoret, bukan dihapus. Tetap tampil di daftar, tapi tidak ikut dibeli dan tidak masuk quotation.</div>
      )}
    </div>
  )
}
