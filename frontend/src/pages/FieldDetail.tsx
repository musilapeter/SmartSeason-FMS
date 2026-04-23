import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { fetchField, addFieldUpdate } from "@/lib/api";
import type { FieldWithStatus, FieldUpdate, CropStage } from "@shared/index";

const STAGES: CropStage[] = ["Planted", "Growing", "Ready", "Harvested"];

export function FieldDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuth();
  
  const [field, setField] = useState<FieldWithStatus | null>(null);
  const [updates, setUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [note, setNote] = useState("");
  const [stage, setStage] = useState<CropStage>("Planted");

  const loadData = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await fetchField(id);
      setField(data.field);
      setUpdates(data.updates);
      setStage(data.field.current_stage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addFieldUpdate(id, {
        note,
        stage_at_time: stage,
      });
      setNote("");
      loadData();
    } catch (err: any) {
      alert("Failed to add update: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading field info...</div>;
  if (!field) return <div className="p-8 text-center text-red-500">{error || "Field not found"}</div>;

  const isAssignedAgent = role === "FIELD_AGENT" && field.assigned_agent_id === user?.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-start justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{field.name}</h1>
            <p className="mt-1 text-slate-500">
              Crop: <span className="font-semibold text-slate-700">{field.crop_type}</span> | Planted: {new Date(field.planting_date).toLocaleDateString()}
            </p>
            {field.assigned_agent_name && (
              <p className="mt-1 text-xs text-slate-400">Assigned Agent: {field.assigned_agent_name}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 border border-slate-200">
              Stage: {field.current_stage}
            </span>
            <StatusBadge status={field.computed_status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800">Observation History</h2>
          
          {updates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 bg-white">
              No updates have been made yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {updates.map((upd) => (
                <li key={upd.id} className="relative bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {new Date(upd.created_at).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {upd.stage_at_time}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{upd.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Update Form (Only for Assigned Agent) */}
        <div className="md:col-span-1">
          {(!isAssignedAgent && role === "FIELD_AGENT") && (
            <div className="rounded-xl bg-slate-50 p-6 border border-slate-200 text-sm text-slate-500">
              You cannot update this field because it is not assigned to you.
            </div>
          )}
          {role === "ADMIN" && (
            <div className="rounded-xl bg-slate-50 p-6 border border-slate-200 text-sm text-slate-500">
              Administrators view in read-only mode. Field agents manage updates.
            </div>
          )}

          {isAssignedAgent && (
            <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 sticky top-24">
              <h3 className="font-semibold text-slate-800 text-lg">Add Observation</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Current Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as CropStage)}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Notes (Pests, Weather, etc.)</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  placeholder="Field looking healthy..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                Submit Update
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">Active</span>;
  }
  if (status === "At Risk") {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200 animate-pulse">At Risk</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 border border-slate-200">Completed</span>;
}
