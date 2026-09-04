import { z } from 'zod'
import type { Loop, CreateLoopInput, LoopState, LoopDirection, LoopSource } from '@/types/loop'

export const loopStateSchema = z.enum(['waiting', 'due', 'overdue', 'escalated', 'closed'])
export const loopDirectionSchema = z.enum(['inbound', 'outbound'])
export const loopSourceSchema = z.enum(['email', 'manual', 'voice'])

export const createLoopSchema = z.object({
  description:   z.string().min(1).max(500),
  counterparty:  z.string().min(1).max(200),
  direction:     loopDirectionSchema,
  source:        loopSourceSchema,
  expected_by:   z.string().datetime(),
  confidence:    z.number().min(0).max(1).optional().default(1),
  source_ref:    z.string().optional(),
})

export const updateLoopSchema = z.object({
  description:  z.string().min(1).max(500).optional(),
  counterparty: z.string().min(1).max(200).optional(),
  expected_by:  z.string().datetime().optional(),
  next_action:  z.string().nullable().optional(),
  confidence:   z.number().min(0).max(1).optional(),
})

export const stateTransitionSchema = z.object({
  to:     loopStateSchema,
  reason: z.string().optional(),
})

export type { Loop, CreateLoopInput, LoopState, LoopDirection, LoopSource }
