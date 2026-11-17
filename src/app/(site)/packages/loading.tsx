import { PackageListingSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="container-page py-10 md:py-14">
      <PackageListingSkeleton />
    </div>
  );
}
