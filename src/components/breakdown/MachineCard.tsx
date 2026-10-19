'use client'

import { useState } from 'react'
import { useAction } from '@/components/ui/Providers'
import type { Form, MachineField } from '@/domain/types'
import { editMachineAction } from '@/server/actions/shared'

const FIELDS: [MachineField, string][] = [['brand', 'Merk Compressor / Dryer'], ['model', 'Model'], ['serial', 'SN / Bar / Tahun'], ['variant', 'Varian (Connection)']]

/** Machine data from the paper technician form; editable only while the form is still open to the technician (or Sales). */
export function MachineCard({ form: f, canEdit }: { form: Form; canEdit: boolean }) {
  const { run } = useAction()
  const [rev, setRev] = useState(0)
  const m = f.machine
  if (!canEdit && !(m && Object.values(m).some(Boolean))) return null
  return (
    <div className="card">
      <h3>Data mesin</h3>
      <div className="grid2" key={rev}>
        {FIELDS.map(([k, label]) => (
          <div className="fld" key={k}>
            <label className="l" htmlFor={`m-${k}`}>{label}</label>
            {canEdit ? (
              <input
                id={`m-${k}`}
                defaultValue={m?.[k] ?? ''}
                onBlur={async (e) => {
                  if (e.target.value.trim() !== (m?.[k] ?? '')) {
                    await run(editMachineAction(f.id, k, e.target.value))
                    setRev((r) => r + 1)
                  }
                }}
              />
            ) : (
              <div>{m?.[k] || '—'}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
