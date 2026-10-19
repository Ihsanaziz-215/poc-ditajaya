import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { decide } from '@/domain/commands/sales'
import { createStore } from './store'
import { runAs } from './runAs'

const mk = () => createStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'run-')), 'db.json'))

test('runs a command as the given role and persists it', async () => {
  const s = mk()
  const f2 = (await s.read()).forms[1].id
  const r = await runAs('Sales', (db, ctx) => decide(db, ctx, f2, 'Disetujui'), s)
  expect(r.ok).toBe(true)
  expect((await s.read()).forms[1].status).toBe('Disetujui')
})

test('a role mismatch (stale tab) is rejected and nothing changes', async () => {
  const s = mk()
  const f2 = (await s.read()).forms[1].id
  const r = await runAs('Purchasing', (db, ctx) => decide(db, ctx, f2, 'Disetujui'), s)
  expect(r).toMatchObject({ ok: false })
  expect((await s.read()).forms[1].status).toBe('Harga Terisi')
})

test('two identical concurrent commands: one succeeds, one is rejected', async () => {
  const s = mk()
  const f2 = (await s.read()).forms[1].id
  const run = () => runAs('Sales', (db, ctx) => decide(db, ctx, f2, 'Disetujui'), s)
  const rs = await Promise.all([run(), run()])
  expect(rs.filter((r) => r.ok)).toHaveLength(1)
  expect(rs.filter((r) => !r.ok)).toHaveLength(1)
})

test('command messages and redirects pass through, field errors are returned', async () => {
  const s = mk()
  const r = await runAs('Sales', () => ({ message: 'hai', kind: 'info', redirect: '/x' }), s)
  expect(r).toEqual({ ok: true, message: 'hai', kind: 'info', redirect: '/x' })
  const { DomainError } = await import('@/domain/commands/core')
  const e = await runAs('Sales', () => { throw new DomainError('bad', { a: 'b' }) }, s)
  expect(e).toEqual({ ok: false, error: 'bad', fields: { a: 'b' } })
})

test('unexpected errors are rethrown', async () => {
  const s = mk()
  await expect(runAs('Sales', () => { throw new TypeError('bug') }, s)).rejects.toThrow('bug')
})
