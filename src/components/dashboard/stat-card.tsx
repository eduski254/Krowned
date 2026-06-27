import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
      )}
    </>
  );

  const baseClasses =
    "rounded-xl border border-border bg-card p-6 transition-all";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} block hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring`}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
