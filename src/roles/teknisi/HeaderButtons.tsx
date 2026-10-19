'use client'

import { useAction, useUi } from '@/components/ui/Providers'
import { finishWorkAction, submitDraftAction } from './actions'

export function SubmitDraftButton({ fid, can = true }: { fid: string; can?: boolean }) {
  const { run, pending } = useAction()
  return <button className="btn" disabled={pending || !can} title={can ? undefined : 'Hanya Teknisi yang bisa mengajukan form'} onClick={() => run(submitDraftAction(fid))}>Ajukan form</button>
}

export function FinishButton({ fid, can = true }: { fid: string; can?: boolean }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  return (
    <button
      className="btn"
      disabled={pending || !can}
      title={can ? undefined : 'Hanya Teknisi yang bisa mengerjakan breakdown'}
      onClick={async () => {
        if (await confirm({ title: 'Kerjakan breakdown?', text: 'Prototype: pekerjaan langsung ditandai Selesai.', okLabel: 'Tandai Selesai' })) await run(finishWorkAction(fid))
      }}
    >
      Kerjakan breakdown
    </button>
  )
}
