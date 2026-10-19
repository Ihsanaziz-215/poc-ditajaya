'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAction } from '@/components/ui/Providers'
import type { OrgInput } from '@/domain/commands/organizations'
import { ORG_COLUMNS, parseCsv, rowsToOrgs, templateCsv } from '@/lib/orgImport'
import { importOrganizationsAction } from './actions'

/** Import Excel (.xlsx) or CSV. The file is read in the browser, only the parsed rows go to the server. */
export function ImportOrgButton({ canEdit }: { canEdit: boolean }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<OrgInput[]>([])
  const [file, setFile] = useState('')
  const [err, setErr] = useState('')
  const { run, pending } = useAction()

  const pick = async (f: File | undefined) => {
    setErr('')
    setRows([])
    setFile(f?.name ?? '')
    if (!f) return
    try {
      let sheet: unknown[][]
      if (/\.csv$/i.test(f.name)) sheet = parseCsv(await f.text())
      else {
        const { readSheet } = await import('read-excel-file/browser')
        sheet = (await readSheet(f)) as unknown[][]
      }
      const parsed = rowsToOrgs(sheet)
      if (!parsed.length) setErr('File tidak berisi baris data.')
      setRows(parsed)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'File tidak bisa dibaca. Gunakan .xlsx atau .csv.')
    }
  }
  const close = () => { setOpen(false); setRows([]); setFile(''); setErr('') }
  const download = () => {
    const url = URL.createObjectURL(new Blob([templateCsv()], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'template-organizations.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button className="btn sec" disabled={!canEdit} title={canEdit ? undefined : 'Hanya Sales yang bisa import organization'} onClick={() => setOpen(true)}>Import Excel</button>
      {open && (
        <Modal onClose={close}>
          <h3>Import organizations</h3>
          <p className="sub" style={{ color: 'var(--muted)' }}>
            File .xlsx atau .csv dengan baris pertama berisi judul kolom: {ORG_COLUMNS.join(', ')}. Hanya Name yang wajib. Nama yang sudah ada dilewati.{' '}
            <a onClick={download} style={{ cursor: 'pointer' }}>Unduh template</a>
          </p>
          <input type="file" accept=".xlsx,.csv" aria-label="File import" onChange={(e) => pick(e.target.files?.[0])} />
          {file && !err && rows.length > 0 && <p className="sub">{file}: {rows.length} baris siap diimport. Contoh: {rows.slice(0, 3).map((r) => r.name || '(tanpa nama)').join(', ')}{rows.length > 3 ? ', ...' : ''}</p>}
          <div className="err">{err}</div>
          <div className="acts">
            <button className="btn sec" onClick={close}>Batal</button>
            <button
              className="btn"
              disabled={pending || !rows.length}
              onClick={async () => {
                const r = await run(importOrganizationsAction(rows))
                if (r.ok) close()
                else setErr(r.error)
              }}
            >
              Import {rows.length ? `${rows.length} baris` : ''}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
