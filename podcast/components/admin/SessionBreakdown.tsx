import type { SessionBreakdown as SessionBreakdownData } from '@/types/admin'

export function SessionBreakdown({
  breakdown,
}: {
  breakdown: SessionBreakdownData
}) {
  const items = [
    { label: 'Free', value: breakdown.free },
    { label: 'Session 2', value: breakdown.session2 },
    { label: 'Session 3', value: breakdown.session3 },
  ]

  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg p-5">
      <h2 className="text-brand-heading font-semibold mb-4">Session Breakdown</h2>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span className="text-brand-body text-sm">{item.label}:</span>
            <span className="text-brand-amber text-xl font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
