'use client'

import { Icon } from '@/components/ui/Icon'
import { useAction, useUi } from '@/components/ui/Providers'
import { PERSON, ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'
import { resetDemoAction, setRoleAction } from '@/server/actions/app'

export function RoleSwitcher({ role }: { role: Role }) {
  const { run } = useAction()
  const { toast } = useUi()
  return (
    <div className="roles" role="group" aria-label="Ganti role">
      {ROLES.map((r) => (
        <button
          key={r}
          className={`rp ${r === role ? 'on' : ''}`}
          aria-pressed={r === role}
          onClick={async () => {
            const res = await run(setRoleAction(r))
            if (res.ok) toast(`Masuk sebagai ${PERSON[r]} (${r})`)
          }}
        >
          {r}
        </button>
      ))}
    </div>
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
