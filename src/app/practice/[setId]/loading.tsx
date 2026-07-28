import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl p-6 md:p-8">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="mt-4 h-80 rounded-2xl" />
    </main>
  )
}
