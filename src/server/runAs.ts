import { DomainError } from '@/domain/commands/core'
import type { CommandResult, Ctx } from '@/domain/commands/core'
import { now } from '@/domain/derived'
import type { Db, Role } from '@/domain/types'
import { store as defaultStore } from './store'
import type { Store } from './store'

export type ActionResult =
  | { ok: true; message?: string; kind?: 'ok' | 'info' | 'bad'; redirect?: string }
  | { ok: false; error: string; fields?: Record<string, string> }

export async function runAs(
  role: Role,
  fn: (db: Db, ctx: Ctx) => CommandResult,
  s: Store = defaultStore,
): Promise<ActionResult> {
  try {
    const r = await s.mutate((db) => fn(db, { role, now: now(db) }))
    return { ok: true, ...(r || {}) }
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: e.message, fields: e.fields }
    throw e
  }
}
