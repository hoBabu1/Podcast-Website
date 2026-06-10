import { Skeleton } from '@/components/ui/Skeleton'

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-6 w-full max-w-xl" />
          <Skeleton className="h-12 w-48 mt-4" />
        </section>

        {/* Session cards */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-brand-border bg-brand-surface p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
