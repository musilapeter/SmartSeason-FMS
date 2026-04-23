import { useState, useEffect } from "react";
import { fetchUsers, createAgentUser } from "@/lib/api";
import { UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@shared/index";

export function AdminUsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const full_name = form.get("full_name") as string;

    try {
      await createAgentUser({ email, password, full_name, role: "FIELD_AGENT" });
      setSuccess(`User ${full_name} created successfully.`);
      e.currentTarget.reset();
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Personnel Management</h1>
        <p className="text-sm text-text-muted mt-1">
          Invite new Field Agents and manage system access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="lg:col-span-1 border border-border rounded-xl bg-surface p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-text-primary">Invite Field Agent</h2>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 flex justify-between">
                Full Name
              </label>
              <input
                name="full_name"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                placeholder="Agent Name"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                placeholder="agent@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Initial Password</label>
              <input
                name="password"
                type="text"
                required
                minLength={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                placeholder="Temporary password"
              />
            </div>
            
            {error && <p className="text-sm text-status-at-risk mt-2">{error}</p>}
            {success && <p className="text-sm text-green-500 mt-2">{success}</p>}

            <button
              type="submit"
              disabled={adding}
              className="w-full mt-4 flex justify-center items-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-background hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Agent
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 border border-border rounded-xl bg-surface overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">System Users</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-text-muted flex justify-center items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="bg-surface-hover/50 text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                        {new Date(user.created_at || "").toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-text-muted">
                        No users found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
