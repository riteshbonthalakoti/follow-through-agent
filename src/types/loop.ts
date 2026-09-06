export type LoopState = 'waiting' | 'due' | 'overdue' | 'escalated' | 'closed'
export type LoopDirection = 'inbound' | 'outbound'
export type LoopSource = 'email' | 'manual' | 'voice' | 'calendar'

export interface Loop {
  id: string
  owner_id: string
  description: string
  counterparty: string
  direction: LoopDirection
  source: LoopSource
  source_ref: string | null
  created_at: string
  expected_by: string
  state: LoopState
  last_action_at: string
  next_action: string | null
  confidence: number
  nudge_count: number
}

export interface CreateLoopInput {
  description: string
  counterparty: string
  direction: LoopDirection
  source: LoopSource
  expected_by: string
  confidence?: number
  source_ref?: string
}

export type LoopStateTransition = {
  from: LoopState
  to: LoopState
  reason: string
}
