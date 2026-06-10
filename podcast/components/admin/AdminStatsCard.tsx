export function AdminStatsCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg p-5">
      <p className="text-brand-body text-xs uppercase tracking-wide">{label}</p>
      <p className="text-brand-heading text-3xl font-bold mt-2 tracking-tight">{value}</p>
    </div>
  )
}
