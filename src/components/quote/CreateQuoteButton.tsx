'use client'

import { useUi } from '@/components/ui/Providers'

export function CreateQuoteButton() {
  const { toast } = useUi()
  return (
    <button className="btn" onClick={() => toast('Di modul ini quote dibuat dari detail Form Breakdown (tombol Buat Quotation).', 'info')}>
      Create Quote
    </button>
  )
}
