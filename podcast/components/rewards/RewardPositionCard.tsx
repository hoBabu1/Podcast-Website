import { RewardStatusBadge } from './RewardStatusBadge'
import type { RewardPositionRow } from '@/types/rewards'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function RewardPositionCard({ position }: { position: RewardPositionRow }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brand-muted text-xs font-mono">Session {position.session_id}</span>
        <RewardStatusBadge status={position.status} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-brand-heading font-semibold text-lg leading-snug">
          {position.winner_label}
        </h3>
        <p className="text-brand-body text-sm">{position.vault_name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-brand-muted text-xs uppercase tracking-wide">Sponsored capital</p>
          <p className="text-brand-heading font-semibold mt-1">
            ${position.sponsored_amount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-brand-muted text-xs uppercase tracking-wide">Yield generated</p>
          <p className="text-brand-green font-semibold mt-1">
            ${position.current_yield.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-brand-muted text-xs uppercase tracking-wide">Start date</p>
          <p className="text-brand-body mt-1">{formatDate(position.start_date)}</p>
        </div>
        <div>
          <p className="text-brand-muted text-xs uppercase tracking-wide">End date</p>
          <p className="text-brand-body mt-1">{formatDate(position.end_date)}</p>
        </div>
      </div>

      <p className="text-brand-muted text-xs leading-snug">
        Winner receives the yield shown above; the ${position.sponsored_amount.toLocaleString()}{' '}
        principal remains funded by DefiLords.
      </p>
    </div>
  )
}
