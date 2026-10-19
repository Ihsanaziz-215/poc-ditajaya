'use server'

import { markAllBought, resolveFollowUp, sendToSales, setProc, setProcInfo } from '@/domain/commands/purchasing'
import { run } from '@/server/run'
import type { ActionResult } from '@/server/run'

export async function sendToSalesAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => sendToSales(db, ctx, fid))
}
export async function setProcAction(fid: string, iid: string, v: 'In Stock' | 'Dibeli' | 'Indent'): Promise<ActionResult> {
  return run((db, ctx) => setProc(db, ctx, fid, iid, v))
}
export async function setProcInfoAction(fid: string, iid: string, key: 'eta' | 'pnote', value: string): Promise<ActionResult> {
  return run((db, ctx) => setProcInfo(db, ctx, fid, iid, key, value))
}
export async function resolveFollowUpAction(fid: string, iid: string): Promise<ActionResult> {
  return run((db, ctx) => resolveFollowUp(db, ctx, fid, iid))
}
export async function markAllBoughtAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => markAllBought(db, ctx, fid))
}
