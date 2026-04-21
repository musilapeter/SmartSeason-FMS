import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Users, Map, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { signOut, user } = useAuth();

  const links = [
    { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
    { to: "/admin/fields", icon: Map, label: "Fields" },
    { to: "/admin/users", icon: Users, label: "Personnel" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col pt-6 hidden md:flex">
        <div className="px-6 mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="font-bold text-text-primary tracking-tight">Admin Console</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.user_metadata?.full_name || "Admin"}
            </p>
            <p className="text-xs text-text-muted truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-status-at-risk hover:bg-status-at-risk-bg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto w-full">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
