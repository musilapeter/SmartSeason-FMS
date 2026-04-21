import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function Layout() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 font-bold">
                S
              </div>
              <Link to="/" className="text-xl font-bold tracking-tight text-slate-800">
                SmartSeason
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-500 mr-2">Logged in as</span>
                <span className="font-medium text-slate-800">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {role === "ADMIN" ? "Admin" : "Agent"}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
