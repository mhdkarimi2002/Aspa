import type { Metadata } from "next";
import { Geist_Mono, Vazirmatn } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/providers/providers";
import Header from "@/components/shared/header";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "اسپا",
  description: "برنامه تمرین، پیشرفت و تغذیه در یک صفحه خلوت.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "fa";

  return (
    <html
      lang={locale}
      dir={locale === "en" ? "ltr" : "rtl"}
      className={cn(
        "dark h-full antialiased",
        vazirmatn.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-3 focus:ring-ring"
        >
          {locale === "en" ? "Skip to content" : "رفتن به محتوا"}
        </a>
        <Providers>
          <Header locale={locale} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
