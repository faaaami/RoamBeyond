import { ArrowUpRight, Briefcase, Heart, User, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import type { TripType } from "@/data/types";
import { getTripTypes, type HomeContent } from "@/lib/content";
import { SectionHeading } from "../SectionHeading";
import { SectionReveal, StaggerGroup, StaggerItem } from "../SectionReveal";

const icons: Record<TripType, typeof User> = {
  solo: User,
  couple: Heart,
  family: UsersRound,
  friends: Users,
  corporate: Briefcase,
};

export async function TripTypes({ heading }: { heading: HomeContent["tripTypes"] }) {
  const tripTypes = await getTripTypes();
  return (
    <section className="container-page py-16 md:py-24">
      <SectionReveal>
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          lead={heading.lead}
        />
      </SectionReveal>

      <StaggerGroup className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-5 md:gap-4">
        {tripTypes.map((type) => {
          const Icon = icons[type.id];
          return (
            <StaggerItem key={type.id} className="last:col-span-2 md:last:col-span-1">
              <Link
                href={`/packages?type=${type.id}`}
                className="group flex h-full min-h-40 flex-col rounded-xl border border-line bg-white p-5 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-green hover:bg-green hover:text-white active:scale-[0.98]"
              >
                <span className="flex items-start justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-mist text-green transition-colors group-hover:bg-cream group-hover:text-ink">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 text-muted transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-auto pt-5 font-display text-xl font-bold">{type.label}</span>
                <span className="mt-1 text-sm leading-snug text-muted transition-colors group-hover:text-white/85">
                  {type.blurb}
                </span>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}
