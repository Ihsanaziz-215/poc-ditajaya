import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
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

const valid = (db: Db | null): db is Db =>
  !!db && db.version === 1 && !!db.seq && !!db.clock && [db.forms, db.quotes, db.suppliers, db.customers, db.notifs].every(Array.isArray)

/**
 * Shared store for Vercel: every serverless instance has its own /tmp, so a file store makes data
 * flip between instances. One private blob holds the whole Db; writes are compare-and-swap on its ETag.
 */
export function createBlobStore(pathname = 'db.json'): Store {
  const fetchDb = async (): Promise<{ db: Db; etag: string } | null> => {
    const r = await get(pathname, { access: 'private', useCache: false })
    if (!r || r.statusCode !== 200) return null
    try {
      const db = JSON.parse(await new Response(r.stream).text()) as Db
      return valid(db) ? { db, etag: r.blob.etag.replace(/^W\//, '') } : null
    } catch {
      return null
    }
  }
  const save = (db: Db, etag?: string) =>
    put(pathname, JSON.stringify(db), { access: 'private', contentType: 'application/json', allowOverwrite: true, addRandomSuffix: false, ...(etag ? { ifMatch: etag } : {}) })

  const current = async (): Promise<{ db: Db; etag: string }> => {
    const found = await fetchDb()
    if (found) return found
    const db = buildSeed(Date.now())
    const r = await save(db)
    return { db, etag: r.etag }
  }

  // writes from this instance go one at a time; the ETag check covers the other instances
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(job: () => Promise<T>): Promise<T> => {
    const r = queue.then(job)
    queue = r.catch(() => undefined)
    return r
  }

  return {
    read: async () => (await current()).db,
    mutate: (fn) => serial(async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        if (attempt) await new Promise((r) => setTimeout(r, 50 * attempt + Math.random() * 100))
        const { db, etag } = await current()
        const draft = structuredClone(db)
        const result = fn(draft)
        try {
          await save(draft, etag)
          return result
        } catch (e) {
          if (!(e instanceof BlobPreconditionFailedError)) throw e
        }
      }
      throw new Error('Data sedang dipakai banyak orang. Coba lagi.')
    }),
    reset: () => serial(async () => { await save(buildSeed(Date.now())) }),
  }
}

const useBlob = !!process.env.VERCEL && !!process.env.BLOB_READ_WRITE_TOKEN
const g = globalThis as unknown as { __dbStore?: Store }
export const store: Store = (g.__dbStore ??= useBlob ? createBlobStore() : createStore(process.env.DB_PATH ?? path.join(process.env.VERCEL ? os.tmpdir() : path.join(process.cwd(), 'data'), 'db.json')))
