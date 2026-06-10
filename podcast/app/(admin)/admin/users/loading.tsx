import { Skeleton } from '@/components/ui/Skeleton'

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-36" />
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="rounded-lg border border-brand-border divide-y divide-brand-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
