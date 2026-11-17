import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function PanelNotFound() {
  return (
    <section className="flex flex-col items-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-green">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">Not found</h1>
      <p className="mt-3 max-w-md text-muted">The link may be wrong, or the record was deleted.</p>
      <Link href="/admin" className={buttonClass("primary", "lg", "mt-8")}>
        Back to the dashboard
      </Link>
    </section>
  );
}
