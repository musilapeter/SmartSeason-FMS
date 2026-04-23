import { useState, useEffect } from "react";
import { fetchFields, createField } from "@/lib/api";
import { Plus } from "lucide-react";
import { AddFieldForm } from "@/components/AddFieldForm";
import { FieldCard } from "@/components/FieldCard";
import type { FieldWithStatus, CreateFieldPayload } from "@shared/index";

export function AdminFieldsManager() {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Field Management</h1>
          <p className="text-sm text-text-muted mt-1">
            Create fields and monitor global status updates.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex self-start sm:self-auto items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Field
          </button>
        )}
      </div>

      {error && <div className="p-4 rounded-lg bg-status-at-risk-bg text-status-at-risk border border-status-at-risk/20">{error}</div>}

      {showForm && (
        <div className="mb-8">
          <AddFieldForm onSubmit={handleCreateField} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="skeleton h-5 w-2/3 mb-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field, i) => (
            <FieldCard key={field.id} field={field} index={i} />
          ))}
          {fields.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-muted border border-border rounded-xl border-dashed">
              No fields have been created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
