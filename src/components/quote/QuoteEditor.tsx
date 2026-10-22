'use client'

import { useState } from 'react'
import { useAction } from '@/components/ui/Providers'
import { Tbc } from '@/components/ui/Badge'
import { calc } from '@/domain/derived'
import type { QuoteField } from '@/domain/commands/sales'
import type { Quote } from '@/domain/types'
import { fd, rp } from '@/lib/format'
import { addQuoteExtraAction, removeQuoteExtraAction, setQuoteDiscountAction, setQuoteFieldAction } from '@/roles/sales/actions'

export function QuoteEditor({ quote: q, vi, tab, editable, owners, formId }: { quote: Quote; vi: number; tab: 'info' | 'items'; editable: boolean; owners: string[]; formId: string | null }) {
  const { run, pending } = useAction()
  const [rev, setRev] = useState(0)
  const v = q.versions[vi]
  const c = calc(v)
  const dis = !editable
  const set = async (key: QuoteField, value: string) => {
    if (value === v[key]) return
    await run(setQuoteFieldAction(q.id, key, value))
    setRev((r) => r + 1)
  }
  const k = `${rev}-${v.ver}`
  const txt = (key: QuoteField, label: React.ReactNode, o: { full?: boolean; type?: string; ph?: string; area?: boolean } = {}) => (
    <div className={`fld${o.full ? ' full' : ''}`} key={key + k}>
      <label className="l">{label}</label>
      {o.area ? (
        <textarea disabled={dis} style={{ minHeight: 64 }} defaultValue={v[key]} onBlur={(e) => set(key, e.target.value)} />
      ) : (
        <input type={o.type} disabled={dis} defaultValue={v[key]} placeholder={o.ph} onBlur={(e) => set(key, e.target.value)} />
      )}
    </div>
  )
  const note = (t: string) => <small style={{ color: 'var(--muted)', fontWeight: 400 }}>{t}</small>

  if (tab === 'items') {
    return (
      <>
        <h3>Quote Items</h3>
        <p className="sub">{formId ? `Item dan harga mengikuti Form Breakdown ${formId}. Ubah harga atau qty di form, bukan di sini. Barang habis pakai (mur, lem) yang tidak ada di gudang bisa ditambah di bawah tabel.` : 'Quote lama tanpa Form Breakdown.'}</p>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th>Product Name</th><th className="num">Quantity</th><th className="num">Price</th><th className="num">Amount</th><th className="num">Discount</th><th className="num">Total</th></tr></thead>
            <tbody>
              {v.items.map((i) => {
                const a = i.qty * i.price
                return (
                  <tr key={i.iid + k}>
                    <td>{i.name}{i.extra && <> <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--line, #ddd)', borderRadius: 5, padding: '1px 6px' }} title="Hanya di quotation, tidak masuk pengadaan">Non-stok</span> {!dis && <button className="btn sec sm" disabled={pending} onClick={async () => { await run(removeQuoteExtraAction(q.id, i.iid)); setRev((r) => r + 1) }}>Hapus</button>}</>}</td><td className="num">{i.qty}{i.unit ? ` ${i.unit}` : ''}</td><td className="num">{rp(i.price)}</td><td className="num">{rp(a)}</td>
                    <td className="num">
                      <input
                        className="p" type="number" min={0} disabled={dis} defaultValue={i.disc || 0} aria-label="Diskon"
                        onBlur={async (e) => { if (Number(e.target.value) !== (i.disc || 0)) { await run(setQuoteDiscountAction(q.id, i.iid, e.target.value)); setRev((r) => r + 1) } }}
                      />
                    </td>
                    <td className="num">{rp(Math.max(a - (i.disc || 0), 0))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <form
          style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}
          onSubmit={async (e) => {
            e.preventDefault()
            const fm = e.currentTarget
            const d = new FormData(fm)
            const r = await run(addQuoteExtraAction(q.id, { name: String(d.get('name')), qty: Number(d.get('qty')), unit: String(d.get('unit')), price: Number(d.get('price')) }))
            if (r?.ok) { fm.reset(); setRev((x) => x + 1) }
          }}
        >
          <input name="name" placeholder="Barang tambahan (mis. Lem, Mur)" aria-label="Nama barang tambahan" disabled={dis} style={{ flex: '1 1 220px' }} />
          <input name="qty" type="number" min={1} defaultValue={1} aria-label="Qty" disabled={dis} style={{ width: 70 }} />
          <input name="unit" placeholder="Satuan" aria-label="Satuan" disabled={dis} style={{ width: 90 }} />
          <input name="price" type="number" min={0} placeholder="Harga" aria-label="Harga" disabled={dis} style={{ width: 120 }} />
          <button className="btn sec sm" type="submit" disabled={dis || pending} title={dis ? 'Hanya Sales yang bisa menambah barang' : undefined}>Tambah barang</button>
        </form>
        <div className="sum" style={{ marginTop: 14 }}>
          <div><span>Subtotal</span><span>{rp(c.sub)}</span></div>
          <div><span>Diskon</span><span>- {rp(c.disc)}</span></div>
          <div><span>PPN 11% <Tbc t="PRD D1 menambahkan PPN ke total. Contoh quotation Ditajaya memakai harga excl. PPN. Perlu dipastikan." /></span><span>{rp(c.tax)}</span></div>
          <div className="g"><span>Grand Total</span><span>{rp(c.grand)}</span></div>
        </div>
      </>
    )
  }
  return (
    <>
      <h3>Quote Information</h3>
      <p className="sub">Put the basic information of the quote.</p>
      <div className="grid2" style={{ maxWidth: 980 }}>
        {txt('subject', <>Subject <span className="req">*</span></>, { full: true })}
        {txt('desc', 'Description', { full: true, area: true })}
        <div className="fld" key={'owner' + k}>
          <label className="l">Sales Owner <span className="req">*</span></label>
          <select disabled={dis} defaultValue={v.owner} onChange={(e) => set('owner', e.target.value)}>{owners.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        {txt('pic', <>Person <span className="req">*</span></>, { ph: 'Nama PIC' })}
        <div className="fld"><label className="l">Link to lead</label><select disabled><option>Click to add</option></select></div>
      </div>
      <h3 style={{ marginTop: 24 }}>Data pengiriman dan dokumen <Tbc t="Field tambahan D1 di PRD adalah usulan." /></h3>
      <p className="sub">Tambahan dari PRD D1 agar data cukup untuk membentuk dokumen quotation.</p>
      <div className="grid2" style={{ maxWidth: 980 }}>
        {txt('email', <>Email PIC <span className="req">*</span> {note('wajib untuk kirim')}</>, { type: 'email', ph: 'pic@customer.com' })}
        {txt('addr', 'Alamat')}
        <div className="fld"><label className="l">Nomor quotation {note('otomatis')}</label><input disabled value={q.number} readOnly /></div>
        <div className="fld"><label className="l">Tanggal {note('otomatis')}</label><input disabled value={fd(v.date)} readOnly /></div>
        {txt('termin', 'Termin pembayaran')}
        {txt('estimasi', 'Estimasi pengiriman')}
        {txt('catatan', 'Catatan', { full: true, area: true })}
      </div>
    </>
  )
}
