'use client'

import { useUi } from '@/components/ui/Providers'

export function SaveButton() {
  const { toast } = useUi()
  return <button className="btn" onClick={() => toast('Quote disimpan.', 'ok')}>Save Quote</button>
}
