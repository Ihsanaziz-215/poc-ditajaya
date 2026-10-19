'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { markAllNotifsRead, markNotifRead } from '@/domain/commands/shared'
import { PERSON } from '@/domain/types'
import type { Role } from '@/domain/types'
import { checkLogin, SESSION_COOKIE, SESSION_TTL_MS, signSession } from '@/lib/auth'
import { run } from '../run'
import type { ActionResult } from '../run'
import { store } from '../store'

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  const role = checkLogin(email, password)
  if (!role) return { ok: false, error: 'Email atau password salah.' }
  ;(await cookies()).set(SESSION_COOKIE, signSession(role), {
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath('/', 'layout')
  return { ok: true, message: `Masuk sebagai ${PERSON[role]} (${role})`, redirect: '/breakdown' }
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
