import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-md bg-muted animate-pulse motion-reduce:animate-none motion-reduce:opacity-70",
        className,
      )}
    />
  );
}
