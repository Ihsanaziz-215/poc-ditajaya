'use client'

import { useAction } from '@/components/ui/Providers'
import { recordFollowUpAction } from './actions'

export function FollowUpButton({ cid }: { cid: string }) {
  const { run, pending } = useAction()
  return <button className="btn sec sm" disabled={pending} onClick={() => run(recordFollowUpAction(cid))}>Catat follow up</button>
}
