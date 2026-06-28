import { Skeleton } from "@/components/skeleton";

export default function ServicesLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-16 ml-auto" />
              <Skeleton className="h-3 w-10 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
