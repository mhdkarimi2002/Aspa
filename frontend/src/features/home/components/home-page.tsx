import Link from "next/link"
import { ChartColumn, Dumbbell, Utensils } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const points = [
  {
    icon: Dumbbell,
    title: "تمرین",
    body: "برنامه هر روز، با حرکت‌های مشخص.",
  },
  {
    icon: ChartColumn,
    title: "پیشرفت",
    body: "روند را ببینید، نه فقط جلسه آخر را.",
  },
  {
    icon: Utensils,
    title: "تغذیه",
    body: "یادداشت کوتاه، کنار همان برنامه.",
  },
]

export function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide">
            <span dir="ltr">ASPA</span>
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-11")}>
            ورود
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 md:px-6 md:py-16">
        <div className="flex max-w-xl flex-col gap-6">
          <p className="text-sm font-medium text-primary">برنامه روزانه</p>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl leading-tight font-semibold md:text-5xl">تمرین، بدون شلوغی</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              برنامه تمرین، پیشرفت و تغذیه را در یک صفحه خلوت نگه دارید.
            </p>
          </div>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-11 w-fit px-5")}>
            شروع
          </Link>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {points.map((point) => (
            <li key={point.title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
                <point.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium">{point.title}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
