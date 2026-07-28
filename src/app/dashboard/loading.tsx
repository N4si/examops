import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Skeleton className="h-8 w-72" />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="mt-12">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-4 h-16 rounded-xl" />
      </div>

      <div className="mt-12">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
