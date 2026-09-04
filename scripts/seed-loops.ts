import { createClient } from '@supabase/supabase-js'

const SEED_OWNER_ID = process.env.SEED_OWNER_ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SEED_OWNER_ID) {
  console.error('Set SEED_OWNER_ID in .env.local to your Supabase user UUID')
  console.error('Find it in: Supabase Dashboard → Authentication → Users')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()
const daysFrom = (n: number) => new Date(now.getTime() + n * 86400000).toISOString()

const loops = [
  {
    owner_id: SEED_OWNER_ID,
    counterparty: 'Rahul',
    description: 'Send revised proposal PDF',
    state: 'overdue',
    direction: 'inbound',
    source: 'manual',
    expected_by: daysAgo(3),
    confidence: 1,
    nudge_count: 1,
    next_action: 'Hi Rahul, following up on the proposal I sent last week. Could you share the revised PDF when you get a chance?',
    last_action_at: daysAgo(3),
    source_ref: null,
  },
  {
    owner_id: SEED_OWNER_ID,
    counterparty: 'Priya',
    description: 'Confirm meeting time for next week',
    state: 'waiting',
    direction: 'inbound',
    source: 'manual',
    expected_by: daysFrom(2),
    confidence: 1,
    nudge_count: 0,
    next_action: null,
    last_action_at: now.toISOString(),
    source_ref: null,
  },
  {
    owner_id: SEED_OWNER_ID,
    counterparty: 'TechCorp HR',
    description: 'Share interview feedback',
    state: 'due',
    direction: 'inbound',
    source: 'email',
    expected_by: now.toISOString(),
    confidence: 0.87,
    nudge_count: 0,
    next_action: null,
    last_action_at: now.toISOString(),
    source_ref: null,
  },
  {
    owner_id: SEED_OWNER_ID,
    counterparty: 'Accountant',
    description: 'Send Q3 tax docs',
    state: 'escalated',
    direction: 'outbound',
    source: 'manual',
    expected_by: daysFrom(5),
    confidence: 1,
    nudge_count: 2,
    next_action: 'Gentle reminder — we need the Q3 docs to file by end of month. Please send at your earliest convenience.',
    last_action_at: daysAgo(1),
    source_ref: null,
  },
]

const { data, error } = await supabase.from('loops').insert(loops).select()

if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`Seeded ${data?.length ?? 0} loops successfully`)
