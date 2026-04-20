import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { FieldCard } from "@/components/FieldCard";
import { AddFieldForm } from "@/components/AddFieldForm";
import { fetchFields, createField } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  ComputedStatus,
  UserRole,
  type FieldWithStatus,
  type CreateFieldPayload,
} from "@shared/index";

type StatusFilter = "all" | ComputedStatus;

/**
 * Dashboard — main page showing all fields with status filtering.
 */
export function Dashboard() {
  const { role } = useAuth();
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  async function loadFields() {
    try {
      setLoading(true);
      const data = await fetchFields();
      setFields(data);
    } catch (err: any) {
      setError(err.message || "Failed to load fields");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFields();
  }, []);

  async function handleCreateField(payload: CreateFieldPayload) {
    await createField(payload);
    setShowForm(false);
    await loadFields();
  }

  // Filter & search
  const filtered = fields.filter((f) => {
    const matchesFilter = filter === "all" || f.computed_status === filter;
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.crop_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Status counts for the summary cards
  const counts = {
    total: fields.length,
    active: fields.filter((f) => f.computed_status === ComputedStatus.Active).length,
    atRisk: fields.filter((f) => f.computed_status === ComputedStatus.AtRisk).length,
    completed: fields.filter((f) => f.computed_status === ComputedStatus.Completed).length,
  };

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `All (${counts.total})` },
    { value: ComputedStatus.Active, label: `Active (${counts.active})` },
    { value: ComputedStatus.AtRisk, label: `At Risk (${counts.atRisk})` },
    { value: ComputedStatus.Completed, label: `Done (${counts.completed})` },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor your fields and track crop progress
          </p>
        </div>
        {role === UserRole.ADMIN && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-background",
              "hover:bg-brand-hover transition-colors self-start"
            )}
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Fields", value: counts.total, color: "text-text-primary" },
          { label: "Active", value: counts.active, color: "text-status-active" },
          { label: "At Risk", value: counts.atRisk, color: "text-status-at-risk" },
          { label: "Completed", value: counts.completed, color: "text-status-completed" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-4 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add Field Form */}
      {showForm && (
        <div className="mb-8">
          <AddFieldForm onSubmit={handleCreateField} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className={cn(
              "w-full rounded-lg border border-border bg-surface pl-10 pr-3 py-2.5 text-sm text-text-primary",
              "placeholder:text-text-muted outline-none",
              "focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
            )}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-text-muted flex-shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                filter === opt.value
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "border border-border text-text-muted hover:text-text-secondary hover:bg-surface-hover"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-status-at-risk/20 bg-status-at-risk-bg p-4 text-sm text-status-at-risk mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="skeleton h-5 w-2/3 mb-3" />
              <div className="skeleton h-4 w-1/3 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fields Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((field, i) => (
            <FieldCard key={field.id} field={field} index={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-border mb-4">
            <Filter className="h-7 w-7 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {fields.length === 0 ? "No fields yet" : "No matching fields"}
          </h3>
          <p className="text-sm text-text-muted max-w-xs">
            {fields.length === 0
              ? "Create your first field to start monitoring."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      )}
    </div>
  );
}
