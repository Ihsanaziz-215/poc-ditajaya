import { PERSON } from '../types'
import type { Db, Form, Role } from '../types'

export class DomainError extends Error {
  fields?: Record<string, string>
  constructor(message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'DomainError'
    this.fields = fields
  }
}

export type Ctx = { role: Role; now: number }
export type CommandResult = { message?: string; kind?: 'ok' | 'info' | 'bad'; redirect?: string } | void

export function requireRole(ctx: Ctx, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) throw new DomainError(`Aksi ini hanya untuk ${roles.join(' atau ')}.`)
}

export function getForm(db: Db, fid: string): Form {
  const f = db.forms.find((x) => x.id === fid)
  if (!f) throw new DomainError('Form tidak ditemukan.')
  return f
}

export const nextId = (db: Db): string => 'i' + ++db.seq.id

export function addLog(ctx: Ctx, f: Form, act: string, o: string | null = '', n: string | null = '', system = false): void {
  f.log.push({
    t: ctx.now,
    user: system ? 'Sistem' : PERSON[ctx.role],
    role: system ? '—' : ctx.role,
    act,
    o: o ?? '',
    n: n ?? '',
  })
}

/** Adds a notification (newest first) and returns the toast text the prototype shows. */
export function notify(db: Db, ctx: Ctx, roles: Role[], fid: string | null, text: string): string {
  db.notifs.unshift({ id: nextId(db), roles, fid, text, t: ctx.now, read: {} })
  return `Notifikasi ke ${roles.join(' & ')}: ${text}`
}
