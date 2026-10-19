'use client'

import { Icon } from '@/components/ui/Icon'
import { useAction, useUi } from '@/components/ui/Providers'
import { PERSON } from '@/domain/types'
import type { Role } from '@/domain/types'
import { logoutAction, resetDemoAction } from '@/server/actions/app'

export function UserMenu({ role }: { role: Role }) {
  const { run, pending } = useAction()
  return (
    <>
      <span className="rp on" title={PERSON[role]}>{PERSON[role]} · {role}</span>
      <button className="ib" title="Keluar" aria-label="Keluar" disabled={pending} onClick={() => run(logoutAction())}>
        <Icon name="lock" />
      </button>
    </>
  )
}

export function ResetButton() {
  const { run } = useAction()
  const { confirm } = useUi()
  return (
    <button
      className="ib"
      title="Reset data demo"
      aria-label="Reset data demo"
      onClick={async () => {
        if (await confirm({ title: 'Reset data demo?', text: 'Semua perubahan di prototype dikembalikan ke data awal.', okLabel: 'Reset' })) await run(resetDemoAction())
      }}
    >
      <Icon name="reset" />
    </button>
  )
}
