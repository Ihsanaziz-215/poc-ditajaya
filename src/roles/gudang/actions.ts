'use server'

import { receive, receiveAll } from '@/domain/commands/gudang'
import { run } from '@/server/run'
import type { ActionResult } from '@/server/run'

export async function receiveAction(
  fid: string, iid: string, input: { date: string; qty: number; cond: 'Baik' | 'Rusak'; note: string },
): Promise<ActionResult> {
  return run((db, ctx) => receive(db, ctx, fid, iid, input))
}
export async function receiveAllAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => receiveAll(db, ctx, fid))
}
