'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import { createFormAction } from './actions'

type Row =
  | { kind: 'item'; name: string; qty: number; unit: string; partNo: string; spec: string }
  | { kind: 'head'; text: string }

const blank = (): Row => ({ kind: 'item', name: '', qty: 1, unit: '', partNo: '', spec: '' })
const UNITS = ['pcs', 'set', 'unit', 'lot', 'meter', 'tabung', 'kg', 'liter', 'roll']

/** Same layout as the paper technician form: header block, one table of parts, note at the bottom. */
export function NewForm({ customers, today, tech }: { customers: string[]; today: string; tech: string }) {
  const { run, pending } = useAction()
  const [cust, setCust] = useState('')
  const [date, setDate] = useState(today)
  const [analysis, setAnalysis] = useState('')
  const [note, setNote] = useState('')
  const [machine, setMachine] = useState({ brand: '', model: '', serial: '', variant: '' })
  const [rows, setRows] = useState<Row[]>([blank()])
  const [err, setErr] = useState<Record<string, string>>({})

  const save = async (submit: boolean) => {
    let group = ''
    const items = rows.flatMap((r) => {
      if (r.kind === 'head') {
        group = r.text
        return []
      }
      return [{ name: r.name, qty: r.qty, unit: r.unit, partNo: r.partNo, spec: r.spec, group }]
    })
    const r = await run(createFormAction({ cust, date, analysis, note, machine, items, submit }))
    setErr(r.ok ? {} : r.fields ?? {})
  }
  const setRow = (i: number, p: Partial<Row>) => setRows((a) => a.map((x, k) => (k === i ? ({ ...x, ...p } as Row) : x)))
  const itemCount = rows.filter((r) => r.kind === 'item').length
  let n = 0

  return (
    <>
      <PageHead crumbs={[['Form Breakdown', '/breakdown'], ['Buat Form']]} title="Buat Form Breakdown">
        <button className="btn sec" disabled={pending} onClick={() => save(false)}>Simpan draft</button>
        <button className="btn" disabled={pending} onClick={() => save(true)}>Ajukan form</button>
      </PageHead>
      <div className="card">
        <p className="sub">Sesuai form analisa kertas. Setelah diajukan, form tidak bisa diedit teknisi.</p>
        <div className="grid2">
          <div className="fld">
            <label className="l">Nama Customer <span className="req">*</span></label>
            <select className={err.cust ? 'miss' : ''} value={cust} onChange={(e) => setCust(e.target.value)}>
              <option value="">Click to add</option>
              {customers.map((c) => <option key={c}>{c}</option>)}
            </select>
            {err.cust && <div className="err">{err.cust}</div>}
          </div>
          <div className="fld">
            <label className="l">Tgl <span className="req">*</span></label>
            <input type="date" className={err.date ? 'miss' : ''} value={date} onChange={(e) => setDate(e.target.value)} />
            {err.date && <div className="err">{err.date}</div>}
          </div>
          <div className="fld"><label className="l" htmlFor="mb">Merk Compressor / Dryer</label><input id="mb" value={machine.brand} placeholder="Contoh: Harland" onChange={(e) => setMachine({ ...machine, brand: e.target.value })} /></div>
          <div className="fld">
            <label className="l">Teknisi</label>
            <input value={tech} disabled readOnly />
          </div>
          <div className="fld"><label className="l" htmlFor="mm">Model</label><input id="mm" value={machine.model} placeholder="Contoh: HRND 930" onChange={(e) => setMachine({ ...machine, model: e.target.value })} /></div>
          <div className="fld"><label className="l" htmlFor="ms">SN / Bar / Thn</label><input id="ms" value={machine.serial} placeholder="Contoh: 3610646 / 1995" onChange={(e) => setMachine({ ...machine, serial: e.target.value })} /></div>
          <div className="fld"><label className="l" htmlFor="mv">Varian (Connection)</label><input id="mv" value={machine.variant} onChange={(e) => setMachine({ ...machine, variant: e.target.value })} /></div>
        </div>
      </div>
      <div className="card">
        <h3>Daftar barang <span className="req">*</span></h3>
        <p className="sub">Nama barang, Part No, qty dan satuan. Tambah judul seksi untuk mengelompokkan barang (contoh: COMPATIBLE). Purchasing mengisi harga dan supplier di tahap berikutnya.</p>
        <div className="wrapx">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th><th>Part Name</th><th style={{ width: 140 }}>Part No</th>
                <th className="num" style={{ width: 90 }}>Qty</th><th style={{ width: 110 }}>Satuan</th><th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, k) =>
                r.kind === 'head' ? (
                  <tr key={k} style={{ background: 'var(--warn-soft)' }}>
                    <td />
                    <td colSpan={4}>
                      <input value={r.text} placeholder="Judul seksi, contoh: COMPATIBLE" aria-label="Judul seksi" style={{ fontWeight: 600, textAlign: 'center' }} onChange={(e) => setRow(k, { text: e.target.value })} />
                    </td>
                    <td><button className="btn sec sm" aria-label="Hapus judul seksi" onClick={() => setRows((a) => a.filter((_, x) => x !== k))}><Icon name="trash" /></button></td>
                  </tr>
                ) : (
                  <tr key={k}>
                    <td>{++n}</td>
                    <td>
                      <input value={r.name} placeholder="Contoh: Filter dryer DML 163s" aria-label={`Nama barang ${n}`} onChange={(e) => setRow(k, { name: e.target.value })} />
                      <textarea
                        value={r.spec}
                        rows={1}
                        placeholder="Baris tambahan (opsional), contoh: type Dunfos TUBE 068U2024 / 01259"
                        aria-label={`Spesifikasi ${n}`}
                        style={{ marginTop: 4, fontSize: 12, minHeight: 34 }}
                        onChange={(e) => setRow(k, { spec: e.target.value })}
                      />
                    </td>
                    <td><input value={r.partNo} placeholder="-" aria-label={`Part No ${n}`} onChange={(e) => setRow(k, { partNo: e.target.value })} /></td>
                    <td className="num"><input className="q" type="number" min={1} value={r.qty} aria-label={`Qty ${n}`} onChange={(e) => setRow(k, { qty: Number(e.target.value) })} /></td>
                    <td><input list="units" value={r.unit} placeholder="pcs" aria-label={`Satuan ${n}`} onChange={(e) => setRow(k, { unit: e.target.value })} /></td>
                    <td>
                      <button className="btn sec sm" aria-label={`Hapus baris ${n}`} onClick={() => itemCount > 1 && setRows((a) => a.filter((_, x) => x !== k))}>
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        {err.items && <div className="err">{err.items}</div>}
        <div className="acts" style={{ marginTop: 12 }}>
          <button className="btn info sm" onClick={() => setRows((a) => [...a, blank()])}><Icon name="plus" />Tambah barang</button>
          <button className="btn sec sm" onClick={() => setRows((a) => [...a, { kind: 'head', text: '' }, blank()])}><Icon name="plus" />Tambah judul seksi</button>
        </div>
      </div>
      <div className="card">
        <h3>Note</h3>
        <textarea placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="l" style={{ marginTop: 14 }}>Hasil analisa <small style={{ color: 'var(--muted)' }}>(opsional, tidak ada di form kertas)</small></label>
        <textarea className={err.analysis ? 'miss' : ''} value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
      </div>
    </>
  )
}
