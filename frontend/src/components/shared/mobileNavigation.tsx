"use client";

import { cn } from "cn";
import Link from "next/link";
import type { HeaderLink } from "./header";

interface Props {
  headerLinks: HeaderLink[];
  locale: string;
  pathname: string;
  text: {
    nav: string;
  };
}

export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNavigation({ headerLinks, locale, pathname, text }: Props) {
  return (
    <nav
      aria-label={text.nav}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/30 bg-card px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {headerLinks.map((link) => {
          const current = isCurrent(pathname, link.href);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-xs leading-none transition-colors duration-200",
                  "focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                  current ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {locale === "en" ? link.en : link.fa}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileNavigation;
