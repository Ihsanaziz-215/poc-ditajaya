'use client'

import { Icon } from '@/components/ui/Icon'
import { useAction, useUi } from '@/components/ui/Providers'
import { deleteOrganizationAction } from './actions'

export function DeleteOrgButton({ cid, name }: { cid: string; name: string }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  return (
    <button
      className="btn sec sm"
      disabled={pending}
      aria-label={`Hapus ${name}`}
      onClick={async () => {
        if (await confirm({ title: 'Hapus organization?', text: `${name} akan dihapus dari daftar. Organization yang masih punya form breakdown tidak bisa dihapus.`, okLabel: 'Hapus' })) await run(deleteOrganizationAction(cid))
      }}
    >
      <Icon name="trash" />
    </button>
  )
}
