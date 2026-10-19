import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildSeed } from '@/domain/seed'
import type { Db } from '@/domain/types'

export interface Store {
  read(): Promise<Db>
  mutate<T>(fn: (db: Db) => T): Promise<T>
  reset(): Promise<void>
}

export function createStore(file: string): Store {
  let queue: Promise<unknown> = Promise.resolve()

  const write = (db: Db) => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(db))
    fs.renameSync(tmp, file)
  }

  const load = (): Db => {
    try {
      const db = JSON.parse(fs.readFileSync(file, 'utf8')) as Db
      if (db && db.version === 1 && db.seq && db.clock && [db.forms, db.quotes, db.suppliers, db.customers, db.notifs].every(Array.isArray)) return db
    } catch {
      /* missing or corrupt: fall through to seed */
    }
    const db = buildSeed(Date.now())
    write(db)
    return db
  }

  const serial = <T>(job: () => T): Promise<T> => {
    const run = queue.then(job)
    queue = run.catch(() => undefined)
    return run
  }

  return {
    read: () => serial(() => structuredClone(load())),
    mutate: (fn) =>
      serial(() => {
        const draft = structuredClone(load())
        const result = fn(draft)
        write(draft)
        return result
      }),
    reset: () => serial(() => write(buildSeed(Date.now()))),
  }
}

const g = globalThis as unknown as { __dbStore?: Store }
export const store: Store = (g.__dbStore ??= createStore(process.env.DB_PATH ?? path.join(process.env.VERCEL ? os.tmpdir() : path.join(process.cwd(), 'data'), 'db.json')))
