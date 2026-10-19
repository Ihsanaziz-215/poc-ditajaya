'use client'

import { useUi } from '@/components/ui/Providers'

export function SaveButton({ can = true }: { can?: boolean }) {
  const { toast } = useUi()
  return (
    <button className="btn" disabled={!can} title={can ? undefined : 'Hanya Sales yang bisa mengubah quote (versi terbaru)'} onClick={() => toast('Quote disimpan.', 'ok')}>
      Save Quote
    </button>
  )
}
