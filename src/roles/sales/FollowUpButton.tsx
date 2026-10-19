'use client'

import { Icon } from '@/components/ui/Icon'
import { useAction } from '@/components/ui/Providers'
import { recordFollowUpAction } from './actions'

export function FollowUpButton({ cid, canEdit }: { cid: string; canEdit: boolean }) {
  const { run, pending } = useAction()
  return (
    <button
      className="btn sm"
      disabled={pending || !canEdit}
      title={canEdit ? 'Catat bahwa customer ini sudah di-follow up bulan ini' : 'Hanya Sales yang bisa mencatat follow up'}
      onClick={() => run(recordFollowUpAction(cid))}
    >
      <Icon name="check" />Sudah follow up
    </button>
  )
}
