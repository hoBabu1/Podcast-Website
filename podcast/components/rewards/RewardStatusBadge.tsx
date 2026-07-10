import type { RewardStatus } from '@/types/rewards'

const STYLES: Record<RewardStatus, string> = {
  active: 'bg-brand-amberDeep border-brand-amberDark text-brand-amber',
  completed: 'bg-brand-border border-brand-muted text-brand-body',
  paid: 'bg-brand-greenDeep border-brand-greenBorder text-brand-green',
}

const LABELS: Record<RewardStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  paid: 'Paid',
}

export function RewardStatusBadge({ status }: { status: RewardStatus }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
