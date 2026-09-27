import { cn } from "cn";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";

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

export default NavLink;
