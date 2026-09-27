"use client";

import { buttonVariants } from "@/components/ui/button";
import { useUserStore } from "@/stores/user-store";
import { cn } from "cn";
import {
  Dumbbell,
  House,
  Info,
  LayoutList,
  Menu,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Locale = "fa" | "en";

const headerLinks: {
  href: string;
  fa: string;
  en: string;
  icon: LucideIcon;
}[] = [
  { href: "/", fa: "خانه", en: "Home", icon: House },
  { href: "/exercises", fa: "تمرین‌ها", en: "Exercises", icon: Dumbbell },
  {
    href: "/programs",
    fa: "برنامه‌های من",
    en: "My programs",
    icon: LayoutList,
  },
  { href: "/about", fa: "درباره ما", en: "About", icon: Info },
];

const copy = {
  fa: {
    language: "زبان",
    profile: "پروفایل",
    login: "ورود",
    menu: "منو",
    close: "بستن منو",
    nav: "صفحات اصلی",
    skip: "رفتن به محتوا",
  },
  en: {
    language: "Language",
    profile: "Profile",
    login: "Log in",
    menu: "Menu",
    close: "Close menu",
    nav: "Main pages",
    skip: "Skip to content",
  },
} as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({
  locale: initialLocale = "fa",
}: {
  locale?: Locale;
}) {
  const pathname = usePathname();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [menuOpen, setMenuOpen] = useState(false);
  const text = copy[locale];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function applyLocale(next: Locale) {
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "en" ? "ltr" : "rtl";
    document.cookie = `locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const skip = document.querySelector('a[href="#main"]');
    if (skip) skip.textContent = copy[next].skip;
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-sm">
        <div aria-hidden className="h-1 bg-primary" />
        <div className="flex h-16 items-center gap-3 px-3 md:px-4">
          <Link href="/" className="flex h-11 items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span dir="ltr" className="text-sm font-semibold tracking-wide">
                ASPA
              </span>
              <span className="text-xs text-primary">
                {locale === "en" ? "Daily training" : "تمرین روزانه"}
              </span>
            </span>
          </Link>

          <nav aria-label={text.nav} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {headerLinks.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    current={isCurrent(pathname, link.href)}
                    icon={link.icon}
                  >
                    {locale === "en" ? link.en : link.fa}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <div
              role="group"
              aria-label={text.language}
              className="flex items-center rounded-full bg-background p-1"
            >
              {(["fa", "en"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={locale === option}
                  onClick={() => applyLocale(option)}
                  className={cn(
                    "h-11 min-w-11 cursor-pointer rounded-full px-2.5 text-sm transition-colors duration-200",
                    "focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                    locale === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option === "fa" ? "فا" : "EN"}
                </button>
              ))}
            </div>

            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              aria-label={isAuthenticated ? text.profile : text.login}
              className={cn(
                isAuthenticated
                  ? "inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                  : cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 rounded-full border-primary bg-primary/15 text-primary hover:bg-primary/25",
                    ),
              )}
            >
              {isAuthenticated ? <User /> : text.login}
            </Link>

            <button
              type="button"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none md:hidden"
              aria-expanded={menuOpen}
              aria-controls="header-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
              <span className="sr-only">
                {menuOpen ? text.close : text.menu}
              </span>
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="header-menu"
          aria-label={text.nav}
          className="mx-auto mt-2 w-full max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-sm md:hidden"
        >
          <ul className="flex flex-col px-2 py-2">
            {headerLinks.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  current={isCurrent(pathname, link.href)}
                  icon={link.icon}
                >
                  {locale === "en" ? link.en : link.fa}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  current,
  icon: Icon,
  children,
}: {
  href: string;
  current: boolean;
  icon: LucideIcon;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm transition-colors duration-200",
        "focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
        current
          ? "bg-primary/15 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}
