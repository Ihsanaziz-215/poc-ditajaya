'use server'

import { decide, makeQuote, recordFollowUp, reviseForm, sendQuote, setQuoteDiscount, setQuoteField } from '@/domain/commands/sales'
import { createOrganization, deleteOrganization, editOrganization, importOrganizations } from '@/domain/commands/organizations'
import type { OrgInput } from '@/domain/commands/organizations'
import type { QuoteField } from '@/domain/commands/sales'
import { run } from '@/server/run'
import type { ActionResult } from '@/server/run'

export async function editOrganizationAction(cid: string, input: OrgInput): Promise<ActionResult> {
  return run((db, ctx) => editOrganization(db, ctx, cid, input))
}
export async function createOrganizationAction(input: OrgInput): Promise<ActionResult> {
  return run((db, ctx) => createOrganization(db, ctx, input))
}
export async function importOrganizationsAction(rows: OrgInput[]): Promise<ActionResult> {
  return run((db, ctx) => importOrganizations(db, ctx, rows))
}
export async function deleteOrganizationAction(cid: string): Promise<ActionResult> {
  return run((db, ctx) => deleteOrganization(db, ctx, cid))
}
export async function makeQuoteAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => makeQuote(db, ctx, fid))
}
export async function setQuoteFieldAction(qid: string, key: QuoteField, value: string): Promise<ActionResult> {
  return run((db, ctx) => setQuoteField(db, ctx, qid, key, value))
}
export async function setQuoteDiscountAction(qid: string, iid: string, value: number | string): Promise<ActionResult> {
  return run((db, ctx) => setQuoteDiscount(db, ctx, qid, iid, value))
}
export async function sendQuoteAction(qid: string, input: { to: string; cc: string; fail: boolean }): Promise<ActionResult> {
  return run((db, ctx) => sendQuote(db, ctx, qid, input))
}

export async function decideAction(fid: string, res: 'Disetujui' | 'Batal'): Promise<ActionResult> {
  return run((db, ctx) => decide(db, ctx, fid, res))
}
export async function reviseFormAction(fid: string): Promise<ActionResult> {
  return run((db, ctx) => reviseForm(db, ctx, fid))
}

export async function recordFollowUpAction(cid: string): Promise<ActionResult> {
  return run((db, ctx) => recordFollowUp(db, ctx, cid))
}
