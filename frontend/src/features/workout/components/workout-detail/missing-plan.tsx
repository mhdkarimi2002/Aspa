import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import Link from "next/link";

const MissingPlan = () => {
  return (
    <section className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
      <h1 className="text-base font-semibold">این برنامه در دسترس نیست</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        برنامه پیدا نشد یا نشستت تمام شده. به فهرست برنامه‌ها برگرد.
      </p>
      <Link
        href="/workout"
        className={cn(buttonVariants({ variant: "outline" }), "h-11")}
      >
        برنامه‌ها
      </Link>
    </section>
  );
};

export default MissingPlan;
