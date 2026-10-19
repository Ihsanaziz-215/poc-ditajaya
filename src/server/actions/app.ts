'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { markAllNotifsRead, markNotifRead } from '@/domain/commands/shared'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'
import { ROLE_COOKIE } from '@/lib/role'
import { run } from '../run'
import type { ActionResult } from '../run'
import { store } from '../store'

export async function setRoleAction(role: Role): Promise<ActionResult> {
  if (!ROLES.includes(role)) return { ok: false, error: 'Role tidak dikenal.' }
  ;(await cookies()).set(ROLE_COOKIE, role, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function resetDemoAction(): Promise<ActionResult> {
  await store.reset()
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Data demo dikembalikan ke awal', kind: 'ok', redirect: '/breakdown' }
}

export async function markNotifReadAction(id: string, role: Role): Promise<ActionResult> {
  return run((db, ctx) => markNotifRead(db, ctx, id), role)
}

export async function markAllNotifsReadAction(role: Role): Promise<ActionResult> {
  return run((db, ctx) => markAllNotifsRead(db, ctx), role)
}
