import { cn } from "cn";

type StatusBadgeProps = {
  variant: "useSoon" | "review";
  className?: string;
};

const labels = {
  useSoon: "Use soon",
  review: "Review",
} as const;

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
        variant === "useSoon" &&
          "bg-badge-use-soon text-badge-use-soon-foreground",
        variant === "review" &&
          "bg-badge-review text-badge-review-foreground",
        className,
      )}
    >
      {labels[variant]}
    </span>
  );
}
