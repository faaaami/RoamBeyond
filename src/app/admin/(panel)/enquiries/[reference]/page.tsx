import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { EnquiryEditor } from "@/components/admin/EnquiryEditor";
import { formatDate, formatDateTime, formatMobile, timeAgo } from "@/components/admin/format";
import { StatusPill } from "@/components/admin/StatusPill";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteEnquiryAction, quickAction } from "@/lib/admin/actions";
import { adminFind, getMe, getOptions, type EnquiryDetail } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Enquiry" };

type Props = { params: Promise<{ reference: string }> };

export default function EnquiryPage({ params }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/enquiries"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All enquiries
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <EnquiryDetailView params={params} />
      </Suspense>
    </div>
  );
}

async function EnquiryDetailView({ params }: Props) {
  const { reference } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(reference)) notFound();
  const returnTo = `/admin/enquiries/${reference}`;
  const [enquiry, options, me] = await Promise.all([
    adminFind<EnquiryDetail>(`enquiries/${encodeURIComponent(reference)}/`, returnTo),
    getOptions(returnTo),
    getMe(returnTo),
  ]);
  if (!enquiry) notFound();
  const staff = options.staff;
  // Show the button only when the signed-in user may delete enquiries (the API enforces it too).
  const enquiryPerms = me.sections.find((s) => s.key === "enquiries")?.permissions;
  const canDelete = Boolean(enquiryPerms?.delete);
  const canChange = Boolean(enquiryPerms?.change);

  const whatsapp = `https://wa.me/${enquiry.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${enquiry.name.split(" ")[0]}, this is ${me.name.split(" ")[0]} from the travel team. Thank you for your enquiry${
      enquiry.packageName ? ` about ${enquiry.packageName}` : ""
    }.`,
  )}`;

  const travellers = [
    enquiry.adults !== null ? `${enquiry.adults} adult${enquiry.adults === 1 ? "" : "s"}` : "",
    enquiry.children ? `${enquiry.children} child${enquiry.children === 1 ? "" : "ren"}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const trip: [string, ReactNode][] = [
    ["Package", enquiry.packageName && (
      <Link href={`/admin/packages/${enquiry.packageSlug}`} target="_blank" className="inline-flex items-center gap-1 text-green hover:underline">
        {enquiry.packageName}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    )],
    ["Destination", enquiry.destination],
    ["Travelling from", enquiry.departureCity],
    ["Travel date", enquiry.travelDate && formatDate(enquiry.travelDate)],
    ["Duration", enquiry.duration],
    ["Budget", enquiry.budget],
    ["Trip type", enquiry.tripTypeLabel],
    ["Travellers", travellers],
  ];
  const source = enquiry.leadSource;
  const campaign = [source.utmSource, source.utmMedium, source.utmCampaign].filter(Boolean).join(" / ");
  const origin: [string, ReactNode][] = [
    ["Sent from", source.page],
    ["Came from", source.referrer && <span className="break-all">{source.referrer}</span>],
    ["Campaign", campaign],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-6">
        <header className="rounded-xl border border-line bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={enquiry.status} label={enquiry.statusLabel} />
            <span className="text-sm text-muted">
              {enquiry.kindLabel} · received {timeAgo(enquiry.createdAt)} ({formatDateTime(enquiry.createdAt)})
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">{enquiry.name}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`tel:${enquiry.mobile}`} className={buttonClass("primary", "md")}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call {formatMobile(enquiry.mobile)}
            </a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "md")}>
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            {enquiry.email && (
              <a href={`mailto:${enquiry.email}`} className={buttonClass("outline", "md")}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                {enquiry.email}
              </a>
            )}
          </div>
        </header>

        {enquiry.message && (
          <section aria-labelledby="message" className="rounded-xl border border-line bg-white p-5 md:p-6">
            <h2 id="message" className="text-lg font-bold">
              Their message
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{enquiry.message}</p>
          </section>
        )}

        {(canChange || canDelete) && (
          <div className="flex flex-wrap justify-end gap-2">
            {canChange && (
              <ConfirmButton
                action={quickAction.bind(null, {
                  path: `enquiries/${enquiry.reference}/resend-email/`,
                  method: "POST",
                  json: {},
                  redirectTo: `/admin/enquiries/${enquiry.reference}`,
                  message: "The enquiry was emailed to the team again.",
                  returnTo: `/admin/enquiries/${enquiry.reference}`,
                })}
                label="Resend email"
                title="Email the team again?"
                body={<p>The enquiry is sent to the agency inbox once more. Use this if the first email did not arrive.</p>}
                confirmLabel="Send email"
                icon="mail"
                danger={false}
                variant="outline"
              />
            )}
            {canDelete && (
            <ConfirmButton
              action={deleteEnquiryAction.bind(null, enquiry.reference)}
              label="Delete enquiry"
              title="Delete this enquiry?"
              body={
                <>
                  <p>
                    {enquiry.name}’s enquiry will be removed permanently, with its notes and history. This cannot be
                    undone.
                  </p>
                </>
              }
              confirmLabel="Yes, delete it"
            />
            )}
          </div>
        )}

        <Details title="Trip details" rows={trip} empty="A call-back request: no trip details were given." />
        <Details title="Where the lead came from" rows={origin} empty="Direct visit, no campaign tags." />

        <p className="text-xs text-muted">
          Reference {enquiry.reference} ·{" "}
          {enquiry.notifiedAt ? "Team emailed" : "Team email not sent"} ·{" "}
          {enquiry.acknowledgedAt ? "Confirmation emailed to the traveller" : "No confirmation email"}
        </p>
      </div>

      <aside aria-labelledby="follow-up" className="h-fit rounded-xl border border-line bg-white p-5 md:p-6 lg:sticky lg:top-24">
        <h2 id="follow-up" className="text-xl font-bold">
          Follow-up
        </h2>
        <p className="mt-1 text-sm text-muted">Last updated {timeAgo(enquiry.updatedAt)}.</p>
        <div className="mt-5">
          <EnquiryEditor enquiry={enquiry} staff={staff} meId={me.id} />
        </div>
      </aside>
    </div>
  );
}

function Details({ title, rows, empty }: { title: string; rows: [string, ReactNode][]; empty: string }) {
  const filled = rows.filter(([, value]) => value);
  return (
    <section className="rounded-xl border border-line bg-white p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {filled.length > 0 ? (
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {filled.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-0.5 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-shimmer gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-busy="true" aria-label="Loading the enquiry">
      <div className="flex flex-col gap-6">
        <div className="h-48 rounded-xl bg-mist" />
        <div className="h-56 rounded-xl bg-mist" />
      </div>
      <div className="h-[32rem] rounded-xl bg-mist" />
    </div>
  );
}
