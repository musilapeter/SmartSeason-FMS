import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { CropStage } from "@shared/index";
import type { CreateFieldUpdatePayload } from "@shared/index";
import { cn } from "@/lib/utils";

interface AddUpdateFormProps {
  currentStage: CropStage;
  onSubmit: (payload: CreateFieldUpdatePayload) => Promise<void>;
}

/**
 * AddUpdateForm — form for agents/admins to submit a field update note.
 */
export function AddUpdateForm({ currentStage, onSubmit }: AddUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const form = new FormData(e.currentTarget);

    try {
      await onSubmit({
        note: form.get("note") as string,
        stage_at_time: (form.get("stage_at_time") as CropStage) || currentStage,
      });
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit update");
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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <h4 className="text-sm font-semibold text-text-primary">Submit Update</h4>

      {error && (
        <div className="rounded-lg bg-status-at-risk-bg border border-status-at-risk/20 px-3 py-2 text-sm text-status-at-risk">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-status-active-bg border border-status-active/20 px-3 py-2 text-sm text-status-active">
          Update submitted successfully!
        </div>
      )}

      <div>
        <label htmlFor="update-note" className="block text-sm text-text-secondary mb-1.5">
          Note
        </label>
        <textarea
          id="update-note"
          name="note"
          required
          rows={3}
          placeholder="Describe the current field condition..."
          className={cn(inputStyles, "resize-none")}
        />
      </div>

      <div>
        <label htmlFor="update-stage" className="block text-sm text-text-secondary mb-1.5">
          Current Stage
        </label>
        <select
          id="update-stage"
          name="stage_at_time"
          defaultValue={currentStage}
          className={inputStyles}
        >
          {Object.values(CropStage).map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background",
          "hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading ? "Submitting..." : "Submit Update"}
      </button>
    </form>
  );
}
