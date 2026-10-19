'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import { createFormAction } from './actions'

interface Row { name: string; qty: number }

export function NewForm({ customers, today, tech }: { customers: string[]; today: string; tech: string }) {
  const { run, pending } = useAction()
  const [cust, setCust] = useState('')
  const [date, setDate] = useState(today)
  const [analysis, setAnalysis] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Row[]>([{ name: '', qty: 1 }])
  const [err, setErr] = useState<Record<string, string>>({})

  const save = async (submit: boolean) => {
    const r = await run(createFormAction({ cust, date, analysis, note, items, submit }))
    setErr(r.ok ? {} : r.fields ?? {})
  }
  const setItem = (i: number, p: Partial<Row>) => setItems((a) => a.map((x, k) => (k === i ? { ...x, ...p } : x)))

  return (
    <>
      <PageHead crumbs={[['Form Breakdown', '/breakdown'], ['Buat Form']]} title="Buat Form Breakdown">
        <button className="btn sec" disabled={pending} onClick={() => save(false)}>Simpan draft</button>
        <button className="btn" disabled={pending} onClick={() => save(true)}>Ajukan form</button>
      </PageHead>
      <div className="card">
        <h3>Hasil analisa</h3>
        <p className="sub">Catat hasil analisa lapangan. Setelah diajukan, form tidak bisa diedit teknisi.</p>
        <div className="grid2">
          <div className="fld">
            <label className="l">Customer <span className="req">*</span></label>
            <select className={err.cust ? 'miss' : ''} value={cust} onChange={(e) => setCust(e.target.value)}>
              <option value="">Click to add</option>
              {customers.map((c) => <option key={c}>{c}</option>)}
            </select>
            {err.cust && <div className="err">{err.cust}</div>}
          </div>
          <div className="fld">
            <label className="l">Tanggal analisa <span className="req">*</span></label>
            <input type="date" className={err.date ? 'miss' : ''} value={date} onChange={(e) => setDate(e.target.value)} />
            {err.date && <div className="err">{err.date}</div>}
          </div>
          <div className="fld">
            <label className="l">Teknisi</label>
            <input value={tech} disabled readOnly />
          </div>
          <div className="fld full">
            <label className="l">Hasil analisa <span className="req">*</span></label>
            <textarea className={err.analysis ? 'miss' : ''} value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
            {err.analysis && <div className="err">{err.analysis}</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Daftar barang <span className="req">*</span></h3>
        <p className="sub">Nama dan qty barang yang dibutuhkan. Purchasing mengisi harga dan supplier di tahap berikutnya.</p>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th style={{ width: 50 }}>No</th><th>Nama barang</th><th className="num" style={{ width: 120 }}>Qty</th><th style={{ width: 60 }} /></tr></thead>
            <tbody>
              {items.map((i, k) => (
                <tr key={k}>
                  <td>{k + 1}</td>
                  <td><input value={i.name} placeholder="Contoh: Filter dryer DML 163s" aria-label={`Nama barang ${k + 1}`} onChange={(e) => setItem(k, { name: e.target.value })} /></td>
                  <td className="num"><input className="q" type="number" min={1} value={i.qty} aria-label={`Qty ${k + 1}`} onChange={(e) => setItem(k, { qty: Number(e.target.value) })} /></td>
                  <td>
                    <button className="btn sec sm" aria-label={`Hapus baris ${k + 1}`} onClick={() => items.length > 1 && setItems((a) => a.filter((_, x) => x !== k))}>
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {err.items && <div className="err">{err.items}</div>}
        <div className="acts" style={{ marginTop: 12 }}>
          <button className="btn info sm" onClick={() => setItems((a) => [...a, { name: '', qty: 1 }])}><Icon name="plus" />Tambah barang</button>
        </div>
      </div>
      <div className="card">
        <h3>Catatan</h3>
        <textarea placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </>
  )
}
