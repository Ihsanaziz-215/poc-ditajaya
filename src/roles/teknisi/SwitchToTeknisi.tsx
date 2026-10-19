'use client'

import { useAction } from '@/components/ui/Providers'
import { setRoleAction } from '@/server/actions/app'

export function SwitchToTeknisi() {
  const { run } = useAction()
  return <button className="btn" onClick={() => run(setRoleAction('Teknisi'))}>Masuk sebagai Teknisi</button>
}
