import { Skeleton } from '@/components/ui/Skeleton'

export default function SessionLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-12 w-full sm:w-56 mt-4" />
    </div>
  )
}
