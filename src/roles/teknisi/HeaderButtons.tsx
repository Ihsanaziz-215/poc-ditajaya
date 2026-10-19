'use client'

import { useAction, useUi } from '@/components/ui/Providers'
import { finishWorkAction, submitDraftAction } from './actions'

export function SubmitDraftButton({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  return <button className="btn" disabled={pending} onClick={() => run(submitDraftAction(fid))}>Ajukan form</button>
}

export function FinishButton({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  return (
    <button
      className="btn"
      disabled={pending}
      onClick={async () => {
        if (await confirm({ title: 'Kerjakan breakdown?', text: 'Prototype: pekerjaan langsung ditandai Selesai.', okLabel: 'Tandai Selesai' })) await run(finishWorkAction(fid))
      }}
    >
      Kerjakan breakdown
    </button>
  )
}
