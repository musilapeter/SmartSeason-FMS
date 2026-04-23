import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { fetchFields, createField, fetchUsers, fetchBackendHealth } from "@/lib/api";
import type { FieldWithStatus, Profile, CropStage } from "@shared/index";

export function Dashboard() {
  const { role, user } = useAuth();
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendHealth, setBackendHealth] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    crop_type: "",
    planting_date: "",
    assigned_agent_id: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, health] = await Promise.all([
        fetchFields(),
        fetchBackendHealth().catch(() => null)
      ]);
      
      if (health) {
        setBackendHealth(health.message);
      }
      
      // If agent, filter specifically (API should ideally handle this but fall back to client filter just in case)
      if (role === "FIELD_AGENT") {
        setFields(data.filter((f) => f.assigned_agent_id === user?.id));
      } else {
        setFields(data);
      }

      if (role === "ADMIN") {
        const users = await fetchUsers();
        setAgents(users.filter((u) => u.role === "FIELD_AGENT"));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createField({
        ...newField,
        current_stage: "Planted" as CropStage,
        assigned_agent_id: newField.assigned_agent_id || undefined,
      });
      setShowForm(false);
      setNewField({ name: "", crop_type: "", planting_date: "", assigned_agent_id: "" });
      loadData();
    } catch (err: any) {
      alert("Failed to create field: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  // Analytics
  const totalFields = fields.length;
  const activeFields = fields.filter((f) => f.computed_status === "Active").length;
  const atRiskFields = fields.filter((f) => f.computed_status === "At Risk").length;
  const readyFields = fields.filter((f) => f.current_stage === "Ready" || f.current_stage === "Harvested").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === "ADMIN" ? "Coordinator Overview" : "My Assigned Fields"}
          </h1>
          <p className="text-slate-500">Monitor crop progress and status insights.</p>
        </div>
        {role === "ADMIN" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Field"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {backendHealth && (
        <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700 border border-indigo-200">
          <span className="font-semibold">Backend Status:</span> {backendHealth}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Fields" value={totalFields} color="emerald" />
        <StatCard title="Active Fields" value={activeFields} color="blue" />
        <StatCard title="At Risk" value={atRiskFields} color="amber" />
        <StatCard title="Ready / Harvested" value={readyFields} color="indigo" />
      </div>

      {showForm && role === "ADMIN" && (
        <form onSubmit={handleCreate} className="glass rounded-xl p-6 shadow-sm border border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Field</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Field Name</label>
              <input
                required
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Crop Type</label>
              <input
                required
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={newField.crop_type}
                onChange={(e) => setNewField({ ...newField, crop_type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Planting Date</label>
              <input
                required
                type="date"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={newField.planting_date}
                onChange={(e) => setNewField({ ...newField, planting_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Assign Agent</label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={newField.assigned_agent_id}
                onChange={(e) => setNewField({ ...newField, assigned_agent_id: e.target.value })}
              >
                <option value="">-- Unassigned --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Save Field
            </button>
          </div>
        </form>
      )}

      {/* Field List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {fields.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No fields found. {role === "ADMIN" ? "Create one above." : "Wait for an assignment."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {fields.map((field) => (
              <li key={field.id} className="group hover:bg-slate-50 transition-colors">
                <Link to={`/fields/${field.id}`} className="block p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {field.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                        <span>{field.crop_type}</span>
                        <span>•</span>
                        <span>Stage: <span className="font-medium text-slate-700">{field.current_stage}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={field.computed_status} />
                      {role === "ADMIN" && field.assigned_agent_name && (
                        <span className="text-xs text-slate-400">
                          Assigned: {field.assigned_agent_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const bgColors: Record<string, string> = {
    emerald: "bg-emerald-50",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    indigo: "bg-indigo-50",
  };
  const textColors: Record<string, string> = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
  };

  return (
    <div className={`rounded-xl border border-slate-100 p-6 ${bgColors[color]}`}>
      <dt className="text-sm font-medium text-slate-500">{title}</dt>
      <dd className={`mt-2 text-3xl font-bold tracking-tight ${textColors[color]}`}>{value}</dd>
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
