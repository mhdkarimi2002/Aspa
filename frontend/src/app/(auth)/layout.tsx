export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main
        id="main"
        className="mx-auto flex w-full  flex-1 flex-col justify-center max-w-lg px-4 py-10"
      >
        {children}
      </main>
    </div>
  );
}
