'use client'

import { useFormUi } from '@/components/breakdown/FormUi'
import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { sendToSalesAction } from './actions'

export function SendToSalesButton({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  const { setMissing } = useFormUi()
  return (
    <button
      className="btn"
      disabled={pending}
      onClick={async () => {
        const r = await run(sendToSalesAction(fid))
        setMissing(new Set(r.ok ? [] : Object.keys(r.fields ?? {})))
      }}
    >
      <Icon name="send" />Kirim ke Sales
    </button>
  )
}
