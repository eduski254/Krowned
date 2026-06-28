import { Skeleton } from "@/components/skeleton";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-2 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* Filters bar skeleton */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-24 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:w-1/2 lg:flex-none">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="hidden items-center justify-center border-l border-border bg-muted lg:flex lg:w-1/2">
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
