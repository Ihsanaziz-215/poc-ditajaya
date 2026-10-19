'use server'

import { addComment, addItem, deleteItem, editItem } from '@/domain/commands/shared'
import type { ItemField } from '@/domain/commands/shared'
import { toggleStrike } from '@/domain/commands/sales'
import { run } from '../run'
import type { ActionResult } from '../run'

export async function editItemAction(fid: string, iid: string, field: ItemField, value: string | number): Promise<ActionResult> {
  return run((db, ctx) => editItem(db, ctx, fid, iid, field, value))
}
export async function addItemAction(fid: string, input: { name: string; qty: number }): Promise<ActionResult> {
  return run((db, ctx) => addItem(db, ctx, fid, input))
}
export async function deleteItemAction(fid: string, iid: string): Promise<ActionResult> {
  return run((db, ctx) => deleteItem(db, ctx, fid, iid))
}
export async function toggleStrikeAction(fid: string, iid: string): Promise<ActionResult> {
  return run((db, ctx) => toggleStrike(db, ctx, fid, iid))
}
export async function addCommentAction(fid: string, text: string): Promise<ActionResult> {
  return run((db, ctx) => addComment(db, ctx, fid, text))
}
