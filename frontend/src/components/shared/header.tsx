"use client";

import { buttonVariants } from "@/components/ui/button";
import { useUserStore } from "@/stores/user-store";
import { cn } from "cn";
import {
  Dumbbell,
  House,
  Info,
  Languages,
  LayoutList,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "./nav-link";
import MobileNavigation, { isCurrent } from "./mobileNavigation";
import { useThemeStore } from "@/stores/theme.store";

type Locale = "fa" | "en";
export type HeaderLink = {
  href: string;
  fa: string;
  en: string;
  icon: LucideIcon;
};

const headerLinks: HeaderLink[] = [
  { href: "/", fa: "خانه", en: "Home", icon: House },
  { href: "/exercises", fa: "تمرین‌ها", en: "Exercises", icon: Dumbbell },
  {
    href: "/workout",
    fa: "برنامه‌های من",
    en: "Workout",
    icon: Dumbbell,
  },
  { href: "/about", fa: "درباره ما", en: "About", icon: Info },
];

const copy = {
  fa: {
    language: "زبان",
    profile: "پروفایل",
    login: "ورود",
    switchTo: "تغییر زبان به انگلیسی",
    nav: "صفحات اصلی",
    skip: "رفتن به محتوا",
  },
  en: {
    language: "Language",
    profile: "Profile",
    login: "Log in",
    switchTo: "Switch language to Persian",
    nav: "Main pages",
    skip: "Skip to content",
  },
} as const;

export default function Header({
  locale: initialLocale = "fa",
}: {
  locale?: Locale;
}) {
  const pathname = usePathname();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const setLanguage = useThemeStore((state) => state.setLanguage);
  const locale = useThemeStore((state) => state.language);
  const text = copy[locale];
  const nextLocale: Locale = locale === "fa" ? "en" : "fa";

  function applyLocale(next: Locale) {
    setLanguage(next);
    document.documentElement.lang = next;
    document.documentElement.dir = "rtl";
    document.cookie = `locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const skip = document.querySelector('a[href="#main"]');
    if (skip) skip.textContent = copy[next].skip;
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-sm">
        <div aria-hidden className="h-1 bg-primary " />
        <div className="flex h-16 items-center gap-3 px-3 md:px-4">
          <Link href="/" className="flex h-11 items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="size-5" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
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
            <button
              type="button"
              onClick={() => applyLocale(nextLocale)}
              aria-label={text.switchTo}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-semibold tracking-wide text-foreground transition-colors duration-200 hover:border-primary/50 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Languages className="size-4 text-primary" />
              <span dir="ltr">{nextLocale === "en" ? "EN" : "FA"}</span>
            </button>

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
          </div>
        </div>
      </div>

      <MobileNavigation
        text={text}
        headerLinks={headerLinks}
        locale={locale}
        pathname={pathname}
      />
    </header>
  );
}
