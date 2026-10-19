'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import type { Quote } from '@/domain/types'
import { QuoteDocument } from './QuoteDocument'
import { SendQuoteModal } from './SendQuoteModal'

interface Common { quote: Quote; cust: string | null; formId: string | null }

export function PreviewButton({ quote, cust, formId, vi, expired, canSend, className = 'btn sec', small }: Common & { vi: number; expired: boolean; canSend: boolean; className?: string; small?: boolean }) {
  const [open, setOpen] = useState(false)
  const [send, setSend] = useState(false)
  const last = quote.versions[quote.versions.length - 1]
  return (
    <>
      <button className={`${className}${small ? ' sm' : ''}`} onClick={() => setOpen(true)}><Icon name="file" />{small ? 'Preview PDF' : 'Preview PDF'}</button>
      {open && !send && (
        <Modal wide onClose={() => setOpen(false)}>
          <h3>Preview dokumen quotation</h3>
          <p className="sub" style={{ color: 'var(--muted)' }}>PDF dihasilkan otomatis dari data form. Tampilan di bawah adalah simulasi.</p>
          <QuoteDocument quote={quote} vi={vi} cust={cust} formId={formId} expired={expired} />
          <div className="acts">
            <button className="btn sec" onClick={() => setOpen(false)}>Tutup</button>
            {canSend && vi === quote.versions.length - 1 && (
              <button className="btn" onClick={() => setSend(true)}><Icon name="send" />{last.sentAt ? 'Kirim ulang' : 'Kirim email'}</button>
            )}
          </div>
        </Modal>
      )}
      {open && send && <SendQuoteModal quote={quote} cust={cust} onClose={() => { setSend(false); setOpen(false) }} />}
    </>
  )
}

export function SendButton({ quote, cust, small, className = 'btn info' }: Common & { small?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  const last = quote.versions[quote.versions.length - 1]
  return (
    <>
      <button className={`${className}${small ? ' sm' : ''}`} onClick={() => setOpen(true)}><Icon name="send" />{last.sentAt ? 'Kirim ulang' : 'Kirim email'}</button>
      {open && <SendQuoteModal quote={quote} cust={cust} onClose={() => setOpen(false)} />}
    </>
  )
}
