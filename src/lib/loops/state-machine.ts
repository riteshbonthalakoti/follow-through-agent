import type { Loop, LoopState } from '@/types/loop'

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours
const POST_ESCALATION_DAYS = 3 * 24 * 60 * 60 * 1000 // 3 days

// Valid state transitions map
const VALID_TRANSITIONS: Record<LoopState, LoopState[]> = {
  waiting:   ['due', 'closed'],
  due:       ['overdue', 'closed'],
  overdue:   ['escalated', 'closed'],
  escalated: ['waiting', 'closed'],
  closed:    [],
}

export function validateTransition(from: LoopState, to: LoopState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Purely deterministic state computation based on timestamps.
 * Call this on each scan cycle; no LLM involved.
 */
export function computeNewState(loop: Loop, now: Date): LoopState {
  if (loop.state === 'closed') return 'closed'

  const expectedBy = new Date(loop.expected_by)
  const lastAction = new Date(loop.last_action_at)

  if (loop.state === 'waiting') {
    if (now >= expectedBy) return 'due'
    return 'waiting'
  }

  if (loop.state === 'due') {
    if (now.getTime() - expectedBy.getTime() > GRACE_PERIOD_MS) return 'overdue'
    return 'due'
  }

  if (loop.state === 'overdue') {
    // stays overdue until user approves escalation (manual transition to 'escalated')
    return 'overdue'
  }

  if (loop.state === 'escalated') {
    // After escalation sent, re-enters waiting with new expected_by (handled at transition time)
    // Stays escalated until reply detected or manual close
    return 'escalated'
  }

  return loop.state
}

export function getTransitionReason(from: LoopState, to: LoopState): string {
  const reasons: Partial<Record<`${LoopState}->${LoopState}`, string>> = {
    'waiting->due':        'Deadline reached',
    'waiting->closed':     'Reply detected or manually closed',
    'due->overdue':        '24-hour grace period elapsed',
    'due->closed':         'Reply detected or manually closed',
    'overdue->escalated':  'Chase approved and sent by user',
    'overdue->closed':     'Reply detected or manually closed',
    'escalated->waiting':  'Chase sent; awaiting reply with new deadline',
    'escalated->closed':   'Reply detected or manually closed',
  }
  return reasons[`${from}->${to}`] ?? 'Manual transition'
}
