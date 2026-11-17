import { Quote } from "lucide-react";
import { getReviews, type HomeContent } from "@/lib/content";
import { SectionHeading } from "../SectionHeading";
import { SectionReveal, StaggerGroup, StaggerItem } from "../SectionReveal";

/** Customer reviews from the backend. The whole section is hidden until there is at least one. */
export async function Reviews({ heading }: { heading: HomeContent["reviews"] }) {
  const reviews = await getReviews();
  if (reviews.length === 0) return null;

  return (
    <section className="container-page py-16 md:py-24">
      <SectionReveal>
        <SectionHeading eyebrow={heading.eyebrow} title={heading.title} />
      </SectionReveal>

      <StaggerGroup className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
        {reviews.map((review) => (
          <StaggerItem key={review.id} className="h-full">
            <figure className="flex h-full flex-col rounded-xl border border-line bg-white p-6 md:p-7">
              <Quote className="h-8 w-8 text-green" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink">
                {review.text}
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4">
                <p className="font-semibold text-ink">{review.name}</p>
                {review.trip && <p className="text-sm text-muted">{review.trip}</p>}
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
