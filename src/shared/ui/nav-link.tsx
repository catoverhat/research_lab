"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Navigation link marked as current: "page" on its own page, "true" inside its section
 * (`sections` are path prefixes ending in "/", e.g. "/projects/").
 */
export function NavLink({ href, sections = [], children }: { href: string; sections?: string[]; children: ReactNode }) {
  const pathname = usePathname();
  const current = pathname === href ? "page" : sections.some((s) => pathname.startsWith(s)) ? "true" : undefined;
  return (
    <Link href={href} aria-current={current} className={current ? "font-semibold" : undefined}>
      {children}
    </Link>
  );
}
