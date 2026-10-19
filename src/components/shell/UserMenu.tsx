'use client'

import { Icon } from '@/components/ui/Icon'
import { useAction, useUi } from '@/components/ui/Providers'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'
import { resetDemoAction, switchRoleAction } from '@/server/actions/app'

/** Role tabs: the active tab decides what this session can do (rules are enforced on the server). */
export function UserMenu({ role }: { role: Role }) {
  const { run, pending } = useAction()
  return (
    <div className="roles" role="tablist" aria-label="Role aktif">
      {ROLES.map((r) => (
        <button
          key={r}
          role="tab"
          aria-selected={r === role}
          className={`rp ${r === role ? 'on' : ''}`}
          disabled={pending}
          onClick={() => r !== role && run(switchRoleAction(r))}
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
