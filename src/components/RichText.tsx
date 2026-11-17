import { Fragment } from "react";
import type { SiteSettings } from "@/data/types";

const INLINE = /(\{email\}|\{phone\})/;

/**
 * Renders plain text written in the admin:
 * - an empty line starts a new paragraph
 * - lines starting with "- " become a bullet list
 * - {email} and {phone} become links to the contact details in Site settings
 * - {cancellation-terms} on its own line becomes the cancellation terms list
 */
export function RichText({ text, site }: { text: string; site: SiteSettings }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const inline = (line: string) =>
    line.split(INLINE).map((part, i) => {
      if (part === "{email}") return <a key={i} href={`mailto:${site.email}`}>{site.email}</a>;
      if (part === "{phone}") return <a key={i} href={`tel:${site.phone.href}`}>{site.phone.display}</a>;
      return <Fragment key={i}>{part}</Fragment>;
    });

  return (
    <>
      {blocks.map((block, i) => {
        if (block === "{cancellation-terms}") {
          return (
            <ul key={i}>
              {site.cancellationTerms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          );
        }
        const lines = block.split("\n").map((line) => line.trim());
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((line, j) => (
                <li key={j}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </>
  );
}
