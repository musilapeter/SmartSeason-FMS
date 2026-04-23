import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { CropStage } from "@shared/index";
import type { CreateFieldPayload } from "@shared/index";
import { cn } from "@/lib/utils";

interface AddFieldFormProps {
  onSubmit: (payload: CreateFieldPayload) => Promise<void>;
  onCancel: () => void;
}

/**
 * AddFieldForm — simple form for admins to register a new field.
 */
export function AddFieldForm({ onSubmit, onCancel }: AddFieldFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      await onSubmit({
        name: form.get("name") as string,
        crop_type: form.get("crop_type") as string,
        planting_date: form.get("planting_date") as string,
        current_stage: (form.get("current_stage") as CropStage) || CropStage.Planted,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create field");
    } finally {
      setLoading(false);
    }
  }

  const inputStyles = cn(
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary",
    "placeholder:text-text-muted outline-none",
    "focus:border-brand focus:ring-1 focus:ring-brand/30",
    "transition-colors"
  );

  const labelStyles = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-surface p-6 animate-fade-in"
    >
      <h3 className="text-lg font-semibold text-text-primary">Add New Field</h3>

      {error && (
        <div className="rounded-lg bg-status-at-risk-bg border border-status-at-risk/20 px-3 py-2 text-sm text-status-at-risk">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="field-name" className={labelStyles}>Field Name</label>
        <input
          id="field-name"
          name="name"
          required
          placeholder="e.g. North Block A"
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="crop-type" className={labelStyles}>Crop Type</label>
        <input
          id="crop-type"
          name="crop_type"
          required
          placeholder="e.g. Maize, Wheat, Rice"
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="planting-date" className={labelStyles}>Planting Date</label>
        <input
          id="planting-date"
          name="planting_date"
          type="date"
          required
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="crop-stage" className={labelStyles}>Initial Stage</label>
        <select id="crop-stage" name="current_stage" className={inputStyles}>
          {Object.values(CropStage).map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-background",
            "hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating..." : "Create Field"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
