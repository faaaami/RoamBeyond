import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-lg bg-mist", className)} />;
}

export function PackageCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card" aria-hidden="true">
      <Bone className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-5 md:p-6">
        <Bone className="h-4 w-24" />
        <Bone className="h-6 w-3/4" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-2/3" />
        <div className="mt-3 flex items-end justify-between">
          <Bone className="h-8 w-28" />
          <Bone className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PackageListingSkeleton() {
  return (
    <div role="status" aria-label="Loading packages" className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
      <div aria-hidden="true">
        <Bone className="h-11 rounded-full lg:hidden" />
        <div className="hidden flex-col gap-4 rounded-xl border border-line bg-white p-5 lg:flex">
          <Bone className="h-7 w-24" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bone className="h-4 w-28" />
              <Bone className="h-12 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between" aria-hidden="true">
          <Bone className="h-5 w-48" />
          <Bone className="hidden h-12 w-56 rounded-lg sm:block" />
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Generic page skeleton used by the root loading.tsx. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="container-page py-12 md:py-16">
      <div aria-hidden="true">
        <Bone className="h-4 w-32" />
        <Bone className="mt-4 h-12 w-full max-w-xl" />
        <Bone className="mt-4 h-5 w-full max-w-md" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PackageDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading package" className="container-page py-8 md:py-12">
      <div aria-hidden="true">
        <Bone className="h-4 w-56" />
        <Bone className="mt-4 h-12 w-full max-w-2xl" />
        <Bone className="mt-6 aspect-[16/10] w-full rounded-xl md:aspect-[21/9]" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-4">
            <Bone className="h-8 w-40" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
            <Bone className="mt-4 h-40 w-full rounded-xl" />
          </div>
          <Bone className="h-[32rem] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
