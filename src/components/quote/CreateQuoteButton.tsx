'use client'

import { useUi } from '@/components/ui/Providers'

export function CreateQuoteButton({ can }: { can: boolean }) {
  const { toast } = useUi()
  return (
    <button className="btn" disabled={!can} title={can ? undefined : 'Hanya Sales yang bisa membuat quotation'} onClick={() => toast('Di modul ini quote dibuat dari detail Form Breakdown (tombol Buat Quotation).', 'info')}>
      Create Quote
    </button>
  )
}
