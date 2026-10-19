import { cookies } from 'next/headers'
import { ROLES } from '@/domain/types'
import type { Role } from '@/domain/types'

export const ROLE_COOKIE = 'role'

export async function getRole(): Promise<Role> {
  const v = (await cookies()).get(ROLE_COOKIE)?.value
  return ROLES.includes(v as Role) ? (v as Role) : 'Sales'
}
