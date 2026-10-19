'use server'

import { markAllBought, resolveFollowUp, saveSupplier, sendToSales, setProc, setProcInfo, toggleSupplier } from '@/domain/commands/purchasing'
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

export async function saveSupplierAction(input: { id?: string; name: string; contact: string; pic?: string; cats: string[]; active: boolean }): Promise<ActionResult> {
  return run((db, ctx) => saveSupplier(db, ctx, input))
}
export async function toggleSupplierAction(id: string): Promise<ActionResult> {
  return run((db, ctx) => toggleSupplier(db, ctx, id))
}
