import { ArrowLeft, CalendarCheck, PhoneCall, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/admin/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { siteConfig } from "@/lib/admin/site";
import { safeNext } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const NOTICES = {
  expired: { tone: "warn", text: "Your session has ended. Please sign in again to continue." },
  "signed-out": { tone: "info", text: "You have signed out." },
} as const;

const points = [
  { icon: PhoneCall, text: "Every enquiry from the website, the moment it arrives" },
  { icon: CalendarCheck, text: "Follow-ups that are due today, so nobody waits for a call" },
  { icon: Users, text: "Assign leads to the team and keep notes in one place" },
];

export default function LoginPage({ searchParams }: Props) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand panel: static, so it renders instantly */}
      <section
        aria-hidden="true"
        className="relative isolate hidden overflow-hidden bg-green text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      >
        <svg viewBox="0 0 600 600" className="pointer-events-none absolute -right-24 -bottom-24 -z-10 h-[38rem] w-[38rem] text-white/10">
          <path
            d="M40 520 C 160 380, 260 560, 360 380 S 520 200, 560 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="2 16"
            strokeLinecap="round"
          />
          <circle cx="40" cy="520" r="14" fill="currentColor" />
          <circle cx="560" cy="80" r="18" fill="currentColor" />
        </svg>
        <Logo light href="/admin/login" />
        <div className="max-w-md">
          <p className="eyebrow text-cream">Staff area</p>
          <h2 className="mt-3 text-5xl font-extrabold leading-[1.05]">Every traveller gets a call back.</h2>
          <ul className="mt-10 flex flex-col gap-5">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4 text-lg text-white/90">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-cream">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/70">{siteConfig.name} admin panel</p>
      </section>

      {/* Form */}
      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <span className="lg:hidden">
            <Logo href="/admin/login" />
          </span>
          <a
            href={siteConfig.siteUrl}
            className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-green"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to website
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-extrabold">Sign in</h1>
          <p className="mt-2 text-muted">Staff accounts only. Ask an administrator if you need one.</p>
          <div className="mt-8">
            <Suspense fallback={<FormSkeleton />}>
              <LoginPanel searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Reads the query string, so it streams in behind the Suspense boundary. */
async function LoginPanel({ searchParams }: Props) {
  const params = await searchParams;
  const one = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]);
  const reason = one("reason");
  const notice = reason && reason in NOTICES ? NOTICES[reason as keyof typeof NOTICES] : undefined;
  return <LoginForm next={safeNext(one("next"))} notice={notice} />;
}

function FormSkeleton() {
  return (
    <div className="flex animate-shimmer flex-col gap-5" aria-hidden="true">
      <div className="h-[4.75rem] rounded-lg bg-mist" />
      <div className="h-[4.75rem] rounded-lg bg-mist" />
      <div className="h-11 w-2/3 rounded-lg bg-mist" />
      <div className="h-13 rounded-lg bg-mist" />
    </div>
  );
}
