"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiUrl, type ApiErrorBody } from "./api";
import { currentAttribution } from "./attribution";
import type { Enquiry } from "./enquiry-schema";

const FALLBACK_ERROR = "Something went wrong. Please try again, or send your details on WhatsApp.";
const NETWORK_ERROR =
  "We could not reach the server. Check your connection, or send your details on WhatsApp.";

/** Posts an enquiry to the Django API and redirects to /thank-you on success. */
export function useEnquirySubmit() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  async function submit(data: Enquiry) {
    setServerError(null);
    let res: Response;
    try {
      res = await fetch(apiUrl("/api/v1/enquiries/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        // No cookies: the endpoint is public, and this keeps the request a simple CORS call.
        credentials: "omit",
        body: JSON.stringify({ ...data, ...currentAttribution() }),
      });
    } catch {
      setServerError(NETWORK_ERROR);
      return;
    }

    if (res.ok) {
      router.push("/thank-you");
      return;
    }

    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    // The forms validate with the same rules first, so field errors here are rare;
    // show the first one so the visitor knows what to fix.
    const fieldMessage = body?.fields?.[0]?.message;
    setServerError(
      body?.error && fieldMessage ? `${body.error} ${fieldMessage}` : (body?.error ?? FALLBACK_ERROR),
    );
  }

  return { submit, serverError };
}
