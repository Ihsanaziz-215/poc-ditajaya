'use client'

import { Suspense, useState } from 'react'
import { Badge, Tbc } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { useAction } from '@/components/ui/Providers'
import { SearchInput } from '@/components/ui/SearchInput'
import type { Role, Supplier } from '@/domain/types'
import { toggleSupplierAction } from './actions'
import { SupplierModal } from './SupplierModal'
import { SupplierStatusFilter } from './SupplierStatusFilter'

export function SuppliersView({ rows, role }: { rows: Supplier[]; role: Role }) {
  const { run } = useAction()
  const [modal, setModal] = useState<{ supplier?: Supplier } | null>(null)
  const isP = role === 'Purchasing'
  return (
    <>
      <PageHead crumbs={[['Data Supplier']]} title="Data Supplier">
        <button className="btn" disabled={!isP} title={isP ? undefined : 'Hanya Purchasing yang mengelola supplier'} onClick={() => setModal({})}>
          <Icon name="plus" />Tambah Supplier
        </button>
      </PageHead>
      <div className="card">
        <p className="sub">
          Master supplier untuk Purchasing. Dipilih per barang di Form Breakdown dan terlihat semua role di form.
        </p>
        {!isP && <div className="hint" style={{ margin: '0 0 12px' }}><Icon name="lock" />Akses penuh hanya untuk Purchasing. Role {role} hanya melihat.</div>}
        <div className="tools">
          <Suspense><SearchInput basePath="/suppliers" param="sq" /></Suspense>
          <Suspense><SupplierStatusFilter /></Suspense>
          <div className="pager">Per Page <select aria-label="Per page" defaultValue="10"><option>10</option></select> 1 - {rows.length} of {rows.length}</div>
        </div>
        <div className="wrapx">
          <table className="tbl">
            <thead><tr><th>Nama Supplier</th><th>Kontak</th><th>Nama PIC</th><th>Kategori Barang</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td>{s.contact || '—'}</td>
                  <td>{s.pic || '—'}</td>
                  <td>{s.cats.map((c) => <span key={c} className="b gray" style={{ margin: '0 4px 4px 0' }}>{c}</span>)}</td>
                  <td><Badge v={s.active ? 'Aktif' : 'Nonaktif'} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn sec sm" disabled={!isP} aria-label="Edit" onClick={() => setModal({ supplier: s })}><Icon name="pen" /></button>{' '}
                    <button className="btn sec sm" disabled={!isP} onClick={() => run(toggleSupplierAction(s.id))}>{s.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="empty">Tidak ada supplier.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <SupplierModal key={modal.supplier?.id ?? 'new'} supplier={modal.supplier} onClose={() => setModal(null)} />}
    </>
  )
}
