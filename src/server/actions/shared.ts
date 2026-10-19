'use server'

import { addComment, addItem, deleteItem, editItem, editMachine } from '@/domain/commands/shared'
import type { ItemField } from '@/domain/commands/shared'
import { setStrike } from '@/domain/commands/sales'
import type { MachineField, Role } from '@/domain/types'
import { run } from '../run'
import type { ActionResult } from '../run'

export async function editItemAction(fid: string, iid: string, field: ItemField, value: string | number): Promise<ActionResult> {
  return run((db, ctx) => editItem(db, ctx, fid, iid, field, value))
}
export async function addItemAction(fid: string, input: { name: string; qty: number; unit?: string }): Promise<ActionResult> {
  return run((db, ctx) => addItem(db, ctx, fid, input))
}
export async function editMachineAction(fid: string, field: MachineField, value: string): Promise<ActionResult> {
  return run((db, ctx) => editMachine(db, ctx, fid, field, value))
}
export async function deleteItemAction(fid: string, iid: string): Promise<ActionResult> {
  return run((db, ctx) => deleteItem(db, ctx, fid, iid))
}
export async function setStrikeAction(fid: string, iid: string, struck: boolean): Promise<ActionResult> {
  return run((db, ctx) => setStrike(db, ctx, fid, iid, struck))
}
export async function addCommentAction(fid: string, text: string, role: Role): Promise<ActionResult> {
  return run((db, ctx) => addComment(db, ctx, fid, text), role)
}
