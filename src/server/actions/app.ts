'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { markAllNotifsRead, markNotifRead } from '@/domain/commands/shared'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'
import { checkLogin, DEFAULT_ROLE, SESSION_COOKIE, SESSION_TTL_MS, signSession } from '@/lib/auth'
import { getSession } from '@/lib/role'
import { run } from '../run'
import type { ActionResult } from '../run'
import { store } from '../store'

const cookieOpts = {
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  if (!checkLogin(email, password)) return { ok: false, error: 'Email atau password salah.' }
  ;(await cookies()).set(SESSION_COOKIE, signSession(DEFAULT_ROLE), cookieOpts)
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Berhasil masuk', redirect: '/breakdown' }
}

/** Role tabs in the header: only a logged-in session can switch, and the role is re-signed into the session. */
export async function switchRoleAction(role: Role): Promise<ActionResult> {
  if (!(await getSession())) return { ok: false, error: 'Sesi berakhir. Login ulang.' }
  if (!ROLES.includes(role)) return { ok: false, error: 'Role tidak dikenal.' }
  ;(await cookies()).set(SESSION_COOKIE, signSession(role), cookieOpts)
  revalidatePath('/', 'layout')
  return { ok: true, message: `Tab ${role} aktif`, kind: 'info' }
}

export async function logoutAction(): Promise<ActionResult> {
  ;(await cookies()).delete(SESSION_COOKIE)
  revalidatePath('/', 'layout')
  return { ok: true, redirect: '/login' }
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
