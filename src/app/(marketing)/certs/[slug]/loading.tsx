import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-10 w-96 max-w-full" />
        <Skeleton className="mt-3 h-1 w-16 rounded-full" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Skeleton className="h-9 w-56" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </section>
    </>
  )
}
