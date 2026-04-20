import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { AddUpdateForm } from "@/components/AddUpdateForm";
import { fetchField, addFieldUpdate } from "@/lib/api";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type {
  FieldWithStatus,
  FieldUpdate,
  CreateFieldUpdatePayload,
} from "@shared/index";

/**
 * FieldDetail — shows a single field's info, status, and full update timeline.
 */
export function FieldDetail() {
  const { id } = useParams<{ id: string }>();
  const [field, setField] = useState<FieldWithStatus | null>(null);
  const [updates, setUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadField() {
    if (!id) return;
    try {
      setLoading(true);
      const result = await fetchField(id);
      setField(result.field);
      setUpdates(result.updates);
    } catch (err: any) {
      setError(err.message || "Failed to load field");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadField();
  }, [id]);

  async function handleAddUpdate(payload: CreateFieldUpdatePayload) {
    if (!id) return;
    await addFieldUpdate(id, payload);
    await loadField();
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <div className="skeleton h-8 w-48" />
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="skeleton h-6 w-64 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-5 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="animate-fade-in max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="rounded-xl border border-status-at-risk/20 bg-status-at-risk-bg p-6 text-center">
          <p className="text-status-at-risk">{error || "Field not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Field Info Card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{field.name}</h1>
            <p className="text-sm text-text-muted mt-1">{field.crop_type}</p>
          </div>
          <StatusBadge status={field.computed_status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2.5 text-text-secondary">
            <MapPin className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Stage</p>
              <p>{field.current_stage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-text-secondary">
            <Calendar className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Planted</p>
              <p>{formatDate(field.planting_date)}</p>
            </div>
          </div>

          {field.assigned_agent_name && (
            <div className="flex items-center gap-2.5 text-text-secondary">
              <User className="h-4 w-4 text-text-muted" />
              <div>
                <p className="text-text-muted text-xs">Assigned Agent</p>
                <p>{field.assigned_agent_name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-text-secondary">
            <Clock className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Last Update</p>
              <p>
                {field.latest_update
                  ? timeAgo(field.latest_update.created_at)
                  : "No updates"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Update Form */}
      <AddUpdateForm
        currentStage={field.current_stage}
        onSubmit={handleAddUpdate}
      />

      {/* Update Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">
            Update History ({updates.length})
          </h2>
        </div>

        {updates.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-text-muted">No updates recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update, i) => (
              <div
                key={update.id}
                className={cn(
                  "rounded-xl border border-border bg-surface p-4",
                  "animate-slide-in"
                )}
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {update.stage_at_time}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(update.created_at)} ·{" "}
                    {timeAgo(update.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {update.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
