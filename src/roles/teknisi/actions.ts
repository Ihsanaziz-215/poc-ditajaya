'use server'

import { createForm } from '@/domain/commands/teknisi'
import type { CreateFormInput } from '@/domain/commands/teknisi'
import { run } from '@/server/run'
import type { ActionResult } from '@/server/run'

export async function createFormAction(input: CreateFormInput): Promise<ActionResult> {
  return run((db, ctx) => createForm(db, ctx, input))
}
