import { now } from './derived'
import { buildSeed } from './seed'
import type { Ctx } from './commands/core'
import type { Db, Role } from './types'

export const freshDb = (): Db => buildSeed(Date.now())
export const as = (db: Db, role: Role): Ctx => ({ role, now: now(db) })
