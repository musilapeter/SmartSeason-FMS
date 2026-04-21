import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@shared/index";

export function AdminRoute() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="skeleton h-12 w-12 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If not admin, push back to dashboard
  if (role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
