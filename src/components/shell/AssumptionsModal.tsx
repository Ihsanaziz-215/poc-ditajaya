'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ASSUME } from '@/domain/assumptions'

export function AssumptionsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn sec sm" onClick={() => setOpen(true)}>
        Asumsi PRD <span className="b warn">{ASSUME.length}</span>
      </button>
      {open && (
        <Modal wide onClose={() => setOpen(false)}>
          <h3>Asumsi dan titik TBC dari PRD</h3>
          <p className="sub" style={{ color: 'var(--muted)' }}>
            Prototype mengikuti PRD Draft 7 apa adanya. Titik berikut ditandai TBC di UI supaya bisa langsung direspons stakeholder.
          </p>
          <div className="wrapx">
            <table className="tbl">
              <tbody>
                {ASSUME.map((a) => (
                  <tr key={a[0]}>
                    <td style={{ width: '34%' }}><b>{a[0]}</b></td>
                    <td>{a[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="acts"><button className="btn" onClick={() => setOpen(false)}>Tutup</button></div>
        </Modal>
      )}
    </>
  )
}
