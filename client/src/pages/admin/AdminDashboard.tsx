import { useEffect, useState } from "react";
import { fetchFields } from "@/lib/api";
import { ComputedStatus, type FieldWithStatus } from "@shared/index";

export function AdminDashboard() {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchFields();
        setFields(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-text-muted">Loading metrics...</div>;
  }

  const counts = {
    total: fields.length,
    active: fields.filter((f) => f.computed_status === ComputedStatus.Active).length,
    atRisk: fields.filter((f) => f.computed_status === ComputedStatus.AtRisk).length,
    completed: fields.filter((f) => f.computed_status === ComputedStatus.Completed).length,
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-6">System Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Fields", value: counts.total, color: "text-text-primary" },
          { label: "Active", value: counts.active, color: "text-status-active" },
          { label: "Critical Risk", value: counts.atRisk, color: "text-status-at-risk" },
          { label: "Completed", value: counts.completed, color: "text-status-completed" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Shortcuts</h2>
        <div className="flex gap-4">
          <p className="text-sm text-text-muted max-w-sm">
            Use the navigation sidebar to manage users and view detailed field tracking metrics.
            This centralized dashboard puts the system owner in complete control.
          </p>
        </div>
      </div>
    </div>
  );
}
