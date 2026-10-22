'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import type { Quote } from '@/domain/types'
import { QuoteDocument } from './QuoteDocument'
import { SendQuoteModal } from './SendQuoteModal'

const pdfHref = (q: Quote, vi: number) => `/quotes/${q.id}/pdf?v=${vi}`

interface Common { quote: Quote; cust: string | null; formId: string | null }

export function PreviewButton({ quote, cust, formId, vi, canSend, className = 'btn sec', small }: Common & { vi: number; canSend: boolean; className?: string; small?: boolean }) {
  const [open, setOpen] = useState(false)
  const [send, setSend] = useState(false)
  const last = quote.versions[quote.versions.length - 1]
  return (
    <>
      <button className={`${className}${small ? ' sm' : ''}`} onClick={() => setOpen(true)}><Icon name="file" />Preview PDF</button>
      <a className={`${className}${small ? ' sm' : ''}`} href={pdfHref(quote, vi)} download><Icon name="file" />Unduh PDF</a>
      {open && !send && (
        <Modal wide onClose={() => setOpen(false)}>
          <h3>Preview dokumen quotation</h3>
          <p className="sub" style={{ color: 'var(--muted)' }}>PDF dihasilkan otomatis dari data form. Tampilan di bawah adalah pratinjau, unduh untuk mendapatkan file PDF-nya.</p>
          <QuoteDocument quote={quote} vi={vi} cust={cust} formId={formId} />
          <div className="acts">
            <button className="btn sec" onClick={() => setOpen(false)}>Tutup</button>
            <a className="btn sec" href={pdfHref(quote, vi)} download><Icon name="file" />Unduh PDF</a>
            {vi === quote.versions.length - 1 && (
              <button className="btn" disabled={!canSend} title={canSend ? undefined : 'Hanya Sales yang bisa mengirim quotation'} onClick={() => setSend(true)}><Icon name="send" />{last.sentAt ? 'Kirim ulang' : 'Kirim email'}</button>
            )}
          </div>
        </Modal>
      )}
      {open && send && <SendQuoteModal quote={quote} cust={cust} onClose={() => { setSend(false); setOpen(false) }} />}
    </>
  )
}

export function SendButton({ quote, cust, small, className = 'btn info', can = true }: Common & { small?: boolean; className?: string; can?: boolean }) {
  const [open, setOpen] = useState(false)
  const last = quote.versions[quote.versions.length - 1]
  return (
    <>
      <button className={`${className}${small ? ' sm' : ''}`} disabled={!can} title={can ? undefined : 'Hanya Sales yang bisa mengirim quotation'} onClick={() => setOpen(true)}><Icon name="send" />{last.sentAt ? 'Kirim ulang' : 'Kirim email'}</button>
      {open && <SendQuoteModal quote={quote} cust={cust} onClose={() => setOpen(false)} />}
    </>
  )
}
