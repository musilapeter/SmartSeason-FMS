import { Link } from "react-router-dom";
import { MapPin, Calendar, User, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { FieldWithStatus } from "@shared/index";

interface FieldCardProps {
  field: FieldWithStatus;
  index?: number;
}

/**
 * FieldCard — displays a field's key info with status badge.
 * Links to the field detail page.
 */
export function FieldCard({ field, index = 0 }: FieldCardProps) {
  return (
    <Link
      to={`/fields/${field.id}`}
      className={cn(
        "group block rounded-xl border border-border bg-surface p-5",
        "transition-all duration-300 hover:border-border-subtle hover:bg-surface-hover",
        "hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
            {field.name}
          </h3>
          <p className="text-sm text-text-muted mt-0.5">{field.crop_type}</p>
        </div>
        <StatusBadge status={field.computed_status} />
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <MapPin className="h-3.5 w-3.5 text-text-muted" />
          <span className="truncate">{field.current_stage}</span>
        </div>

        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          <span>{formatDate(field.planting_date)}</span>
        </div>

        {field.assigned_agent_name && (
          <div className="flex items-center gap-2 text-text-secondary">
            <User className="h-3.5 w-3.5 text-text-muted" />
            <span className="truncate">{field.assigned_agent_name}</span>
          </div>
        )}

        {field.latest_update && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span>{timeAgo(field.latest_update.created_at)}</span>
          </div>
        )}
      </div>

      {/* Latest Note Preview */}
      {field.latest_update && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-text-muted line-clamp-2">
            {field.latest_update.note}
          </p>
        </div>
      )}
    </Link>
  );
}
