import { revalidatePath } from 'next/cache'
import type { CommandResult, Ctx } from '@/domain/commands/core'
import type { Db, Role } from '@/domain/types'
import { getSession } from '@/lib/role'
import { runAs } from './runAs'
import type { ActionResult } from './runAs'

export type { ActionResult }

/** Runs a command as the logged-in role, then refreshes server-rendered pages. */
export async function run(fn: (db: Db, ctx: Ctx) => CommandResult, expectedRole?: Role): Promise<ActionResult> {
  const role = await getSession()
  if (!role) return { ok: false, error: 'Sesi berakhir. Login ulang.' }
  const r = await runAs(role, fn, undefined, expectedRole)
  revalidatePath('/', 'layout')
  return r
}
