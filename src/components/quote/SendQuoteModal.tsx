'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useAction } from '@/components/ui/Providers'
import type { Quote } from '@/domain/types'
import { fd } from '@/lib/format'
import { sendQuoteAction } from '@/roles/sales/actions'

export function SendQuoteModal({ quote: q, cust, onClose }: { quote: Quote; cust: string | null; onClose: () => void }) {
  const v = q.versions[q.versions.length - 1]
  const { run, pending } = useAction()
  const [to, setTo] = useState(v.sentTo || v.email)
  const [cc, setCc] = useState(v.cc || '')
  const [fail, setFail] = useState(false)
  const [err, setErr] = useState('')
  const resend = !!v.sentAt
  const [subject, setSubject] = useState(`Penawaran ${v.subject} (${q.number})`)
  const [body, setBody] = useState(
    `Dengan hormat,\n\nTerlampir penawaran ${v.subject} (${q.number}, v${v.ver}) untuk ${cust || 'Bapak/Ibu'}. Penawaran berlaku sampai ${fd(v.expiry)}.\n\nMohon konfirmasi dari Bapak/Ibu.\n\nHormat kami,\n${v.owner}\nPT Ditajaya Mitra Perkasa`,
  )
  return (
    <Modal wide onClose={onClose}>
      <h3>{resend ? 'Kirim ulang' : 'Kirim'} quotation v{v.ver} via email</h3>
      <p className="sub" style={{ color: 'var(--muted)' }}>Subject dan isi email berasal dari template dan bisa diedit sebelum kirim.</p>
      <div className="grid2">
        <div><label className="l">Kepada (email PIC) <span className="req">*</span></label><input type="email" value={to} placeholder="pic@customer.com" onChange={(e) => setTo(e.target.value)} /></div>
        <div><label className="l">CC</label><input value={cc} placeholder="Opsional" onChange={(e) => setCc(e.target.value)} /></div>
        <div className="fld full"><label className="l">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="fld full"><label className="l">Isi email</label><textarea style={{ minHeight: 150 }} value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="fld full">
          <label className="l">Lampiran</label>
          <span className="b info"><Icon name="file" style={{ width: 13, height: 13, verticalAlign: -2 }} /> Quotation-{q.number.replace(/\//g, '-')}-v{v.ver}.pdf</span>
        </div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Simulasikan Gagal Kirim <small style={{ color: 'var(--muted)' }}>(khusus demo)</small>
      </label>
      <div className="err">{err}</div>
      <div className="acts">
        <button className="btn sec" onClick={onClose}>Batal</button>
        <button
          className="btn"
          disabled={pending}
          onClick={async () => {
            const r = await run(sendQuoteAction(q.id, { to, cc, fail }))
            if (r.ok) onClose()
            else setErr(r.error)
          }}
        >
          <Icon name="send" />Kirim email
        </button>
      </div>
    </Modal>
  )
}
