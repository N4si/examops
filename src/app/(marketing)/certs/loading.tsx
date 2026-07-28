import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />

      <div className="mt-8 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </section>
  )
}
