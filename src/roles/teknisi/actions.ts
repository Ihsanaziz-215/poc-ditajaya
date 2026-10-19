'use server'

import { confirmItems, createForm, finishWork, submitDraft } from '@/domain/commands/teknisi'
import type { CreateFormInput } from '@/domain/commands/teknisi'
import { run } from '@/server/run'
import type { ActionResult } from '@/server/run'

export async function createFormAction(input: CreateFormInput): Promise<ActionResult> {
  return run((db, ctx) => createForm(db, ctx, input))
}

export async function submitDraftAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => submitDraft(db, ctx, fid))
}
export async function confirmItemsAction(fid: string, res: 'Sesuai' | 'Tidak Sesuai', note: string): Promise<ActionResult> {
  return run((db, ctx) => confirmItems(db, ctx, fid, res, note))
}
export async function finishWorkAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => finishWork(db, ctx, fid))
}
