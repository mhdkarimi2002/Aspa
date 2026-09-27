import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border px-4">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide">
            <span dir="ltr">ASPA</span>
          </Link>
        </div>
      </header>
      <main
        id="main"
        className="mx-auto flex w-full  flex-1 flex-col justify-center max-w-lg px-4 py-10"
      >
        {children}
      </main>
    </div>
  );
}
