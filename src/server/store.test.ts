import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, test } from 'vitest'
import { createStore } from './store'

let file: string
beforeEach(() => {
  file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'store-')), 'db.json')
})
const onDisk = () => JSON.parse(fs.readFileSync(file, 'utf8'))

describe('store', () => {
  test('first read seeds the file', async () => {
    const s = createStore(file)
    expect((await s.read()).forms).toHaveLength(6)
    expect(onDisk().forms).toHaveLength(6)
  })
  test('mutate persists changes', async () => {
    const s = createStore(file)
    await s.mutate((db) => { db.forms.pop() })
    expect((await s.read()).forms).toHaveLength(5)
    expect(onDisk().forms).toHaveLength(5)
  })
  test('a throwing mutate leaves the file untouched', async () => {
    const s = createStore(file)
    await s.read()
    const before = fs.readFileSync(file, 'utf8')
    await expect(s.mutate((db) => { db.forms.pop(); throw new Error('boom') })).rejects.toThrow('boom')
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
    expect((await s.read()).forms).toHaveLength(6)
  })
  test('read returns a copy', async () => {
    const s = createStore(file)
    const a = await s.read()
    a.forms.pop()
    expect((await s.read()).forms).toHaveLength(6)
  })
  test('corrupt json reseeds instead of crashing', async () => {
    fs.writeFileSync(file, '{bad json')
    expect((await createStore(file).read()).forms).toHaveLength(6)
  })
  test('wrong version reseeds', async () => {
    fs.writeFileSync(file, JSON.stringify({ version: 99, forms: [] }))
    expect((await createStore(file).read()).forms).toHaveLength(6)
  })
  test('concurrent mutations are serialized', async () => {
    const s = createStore(file)
    const start = (await s.read()).seq.id
    await Promise.all([s.mutate((db) => { db.seq.id++ }), s.mutate((db) => { db.seq.id++ })])
    expect((await s.read()).seq.id).toBe(start + 2)
  })
  test('reset restores the seed', async () => {
    const s = createStore(file)
    await s.mutate((db) => { db.forms.length = 0 })
    await s.reset()
    expect((await s.read()).forms).toHaveLength(6)
  })
})
