'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAction } from '@/components/ui/Providers'
import type { Supplier } from '@/domain/types'
import { saveSupplierAction } from './actions'

export function SupplierModal({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const { run, pending } = useAction()
  const [name, setName] = useState(supplier?.name ?? '')
  const [contact, setContact] = useState(supplier?.contact ?? '')
  const [pic, setPic] = useState(supplier?.pic ?? '')
  const [cats, setCats] = useState(supplier?.cats.join(', ') ?? '')
  const [active, setActive] = useState(supplier?.active ?? true)
  const [err, setErr] = useState('')
  return (
    <Modal onClose={onClose}>
      <h3>{supplier ? 'Edit' : 'Tambah'} supplier</h3>
            <div className="grid2">
        <div className="fld full"><label className="l">Nama supplier <span className="req">*</span></label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="fld full"><label className="l">Kontak</label><input value={contact} placeholder="Nomor telepon atau email" onChange={(e) => setContact(e.target.value)} /></div>
        <div className="fld full"><label className="l">Nama PIC</label><input value={pic} placeholder="Contoh: Pak Wawan" onChange={(e) => setPic(e.target.value)} /></div>
        <div className="fld full">
          <label className="l">Kategori barang <small style={{ color: 'var(--muted)', fontWeight: 400 }}>pisahkan dengan koma</small></label>
          <input value={cats} onChange={(e) => setCats(e.target.value)} />
        </div>
        <div className="fld full">
          <label className="l">Status</label>
          <select value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}><option value="1">Aktif</option><option value="0">Nonaktif</option></select>
        </div>
      </div>
      <div className="err">{err}</div>
      <div className="acts">
        <button className="btn sec" onClick={onClose}>Batal</button>
        <button
          className="btn"
          disabled={pending}
          onClick={async () => {
            const r = await run(saveSupplierAction({ id: supplier?.id, name, contact, pic, cats: cats.split(','), active }))
            if (r.ok) onClose()
            else setErr(r.error)
          }}
        >
          Simpan
        </button>
      </div>
    </Modal>
  )
}
