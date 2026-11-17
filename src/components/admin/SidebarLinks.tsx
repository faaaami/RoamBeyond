"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sectionIcon } from "./icons";

type NavSection = { key: string; title: string; group: string; icon: string };

const linkClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] transition-colors";

export function SidebarLinks({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const groups = new Map<string, NavSection[]>();
  for (const s of sections) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-5 pt-2">
      <ul>
        <li>
          <Link
            href="/admin"
            aria-current={isActive("/admin", true) ? "page" : undefined}
            className={cn(
              linkClass,
              isActive("/admin", true)
                ? "bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_var(--color-cream)]"
                : "text-white/75 hover:bg-white/8 hover:text-white",
            )}
          >
            <LayoutDashboard className="h-[18px] w-[18px]" aria-hidden="true" />
            Overview
          </Link>
        </li>
      </ul>

      {[...groups].map(([group, items]) => (
        <div key={group}>
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream/80">{group}</p>
          <ul className="flex flex-col gap-0.5">
            {items.map((section) => {
              const Icon = sectionIcon(section.icon);
              const href = `/admin/${section.key}`;
              const active = isActive(href);
              return (
                <li key={section.key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      linkClass,
                      active
                        ? "bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_var(--color-cream)]"
                        : "text-white/75 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    {section.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
