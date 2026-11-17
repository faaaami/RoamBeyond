import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiryCta } from "@/components/EnquiryCta";
import { PackageListing } from "@/components/PackageListing";
import { PageHeader } from "@/components/PageHeader";
import { PackageListingSkeleton } from "@/components/Skeletons";
import { pageMetadata } from "@/lib/seo";
import { getPackages, getPageSeo, getPagesText } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/packages");
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/packages",
  });
}

export default async function PackagesPage() {
  const [packages, pages] = await Promise.all([getPackages(), getPagesText()]);
  const text = pages.packages;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Packages" }]}
        eyebrow={text.eyebrow}
        title={text.title}
        lead={text.lead}
      />
      <section className="container-page py-10 md:py-14">
        {/* The listing reads filters from the URL, so it renders inside Suspense. */}
        <Suspense fallback={<PackageListingSkeleton />}>
          <PackageListing packages={packages} />
        </Suspense>
      </section>
      <EnquiryCta title={text.ctaTitle} />
    </>
  );
}
