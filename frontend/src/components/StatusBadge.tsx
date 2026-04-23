import { cn } from "@/lib/utils";
import { ComputedStatus } from "@shared/index";

interface StatusBadgeProps {
  status: ComputedStatus;
  className?: string;
}

const statusConfig: Record<
  ComputedStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  [ComputedStatus.Active]: {
    label: "Active",
    dotColor: "bg-status-active",
    bgColor: "bg-status-active-bg",
    textColor: "text-status-active",
  },
  [ComputedStatus.AtRisk]: {
    label: "At Risk",
    dotColor: "bg-status-at-risk",
    bgColor: "bg-status-at-risk-bg",
    textColor: "text-status-at-risk",
  },
  [ComputedStatus.Completed]: {
    label: "Completed",
    dotColor: "bg-status-completed",
    bgColor: "bg-status-completed-bg",
    textColor: "text-status-completed",
  },
};

/**
 * StatusBadge — color-coded pill showing the computed field status.
 * 🟢 Active | 🔴 At Risk | 🔵 Completed
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", config.dotColor)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
