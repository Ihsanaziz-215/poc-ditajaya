import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@/domain/types'
import { SESSION_COOKIE, verifySession } from './auth'

/** Role of the logged-in user, or null when there is no valid session. */
export async function getSession(): Promise<Role | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value)
}

/** For pages behind the login: sends visitors without a session to /login. */
export async function getRole(): Promise<Role> {
  const role = await getSession()
  if (!role) redirect('/login')
  return role
}
