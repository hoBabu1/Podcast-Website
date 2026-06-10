import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-64" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-brand-border bg-brand-bg p-5 flex flex-col gap-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-bg p-5 flex flex-col gap-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-wrap gap-8">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  )
}
