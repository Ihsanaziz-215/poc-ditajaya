'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import { createFormAction } from './actions'

interface Row { name: string; qty: number; unit: string; partNo: string; spec: string }
const blank = (): Row => ({ name: '', qty: 1, unit: '', partNo: '', spec: '' })
const UNITS = ['pcs', 'set', 'unit', 'lot', 'meter', 'tabung', 'kg', 'liter', 'roll']

export function NewForm({ customers, today, tech }: { customers: string[]; today: string; tech: string }) {
  const { run, pending } = useAction()
  const [cust, setCust] = useState('')
  const [date, setDate] = useState(today)
  const [analysis, setAnalysis] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Row[]>([blank()])
  const [machine, setMachine] = useState({ brand: '', model: '', serial: '', variant: '' })
  const [err, setErr] = useState<Record<string, string>>({})

  const save = async (submit: boolean) => {
    const r = await run(createFormAction({ cust, date, analysis, note, machine, items, submit }))
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
            <label className="l">Hasil analisa</label>
            <textarea className={err.analysis ? 'miss' : ''} value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
            {err.analysis && <div className="err">{err.analysis}</div>}
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Data mesin</h3>
        <p className="sub">Sesuai form analisa kertas. Semua opsional.</p>
        <div className="grid2">
          <div className="fld"><label className="l" htmlFor="mb">Merk Compressor / Dryer</label><input id="mb" value={machine.brand} placeholder="Contoh: Harland" onChange={(e) => setMachine({ ...machine, brand: e.target.value })} /></div>
          <div className="fld"><label className="l" htmlFor="mm">Model</label><input id="mm" value={machine.model} placeholder="Contoh: HRND 930" onChange={(e) => setMachine({ ...machine, model: e.target.value })} /></div>
          <div className="fld"><label className="l" htmlFor="ms">SN / Bar / Tahun</label><input id="ms" value={machine.serial} placeholder="Contoh: 3610646 / 1995" onChange={(e) => setMachine({ ...machine, serial: e.target.value })} /></div>
          <div className="fld"><label className="l" htmlFor="mv">Varian (Connection)</label><input id="mv" value={machine.variant} onChange={(e) => setMachine({ ...machine, variant: e.target.value })} /></div>
        </div>
      </div>
      <div className="card">
        <h3>Daftar barang <span className="req">*</span></h3>
        <p className="sub">Nama dan qty barang yang dibutuhkan. Purchasing mengisi harga dan supplier di tahap berikutnya.</p>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th style={{ width: 50 }}>No</th><th>Nama barang</th><th style={{ width: 130 }}>Part No</th><th className="num" style={{ width: 90 }}>Qty</th><th style={{ width: 100 }}>Satuan</th><th style={{ width: 60 }} /></tr></thead>
            <tbody>
              {items.map((i, k) => (
                <tr key={k}>
                  <td>{k + 1}</td>
                  <td>
                    <input value={i.name} placeholder="Contoh: Filter dryer DML 163s" aria-label={`Nama barang ${k + 1}`} onChange={(e) => setItem(k, { name: e.target.value })} />
                    <input value={i.spec} placeholder="Spesifikasi tambahan (opsional), contoh: type Danfoss TUBE 068U2024" aria-label={`Spesifikasi ${k + 1}`} style={{ marginTop: 4, fontSize: 12 }} onChange={(e) => setItem(k, { spec: e.target.value })} />
                  </td>
                  <td><input value={i.partNo} placeholder="-" aria-label={`Part No ${k + 1}`} onChange={(e) => setItem(k, { partNo: e.target.value })} /></td>
                  <td className="num"><input className="q" type="number" min={1} value={i.qty} aria-label={`Qty ${k + 1}`} onChange={(e) => setItem(k, { qty: Number(e.target.value) })} /></td>
                  <td><input list="units" value={i.unit} placeholder="pcs" aria-label={`Satuan ${k + 1}`} onChange={(e) => setItem(k, { unit: e.target.value })} /></td>
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
        <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        {err.items && <div className="err">{err.items}</div>}
        <div className="acts" style={{ marginTop: 12 }}>
          <button className="btn info sm" onClick={() => setItems((a) => [...a, blank()])}><Icon name="plus" />Tambah barang</button>
        </div>
      </div>
      <div className="card">
        <h3>Catatan</h3>
        <textarea placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </>
  )
}
