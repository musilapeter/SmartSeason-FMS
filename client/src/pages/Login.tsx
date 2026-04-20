import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserRole } from "@shared/index";

/**
 * Login — authentication page with sign-in and sign-up tabs.
 */
export function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        const fullName = form.get("full_name") as string;
        const role = (form.get("role") as UserRole) || UserRole.FIELD_AGENT;
        await signUp(email, password, fullName, role);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyles = cn(
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary",
    "placeholder:text-text-muted outline-none",
    "focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 mb-4">
            <Sprout className="h-7 w-7 text-brand" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">SmartSeason</h1>
          <p className="text-sm text-text-muted mt-1">Field Monitoring System</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-border bg-surface p-1 mb-6">
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab);
                setError("");
              }}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                mode === tab
                  ? "bg-brand/10 text-brand"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {tab === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-status-at-risk-bg border border-status-at-risk/20 px-3 py-2.5 text-sm text-status-at-risk mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="full-name" className="block text-sm text-text-secondary mb-1.5">
                Full Name
              </label>
              <input
                id="full-name"
                name="full_name"
                required
                placeholder="John Doe"
                className={inputStyles}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-text-secondary mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-text-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                className={cn(inputStyles, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="role" className="block text-sm text-text-secondary mb-1.5">
                Role
              </label>
              <select id="role" name="role" className={inputStyles}>
                <option value={UserRole.FIELD_AGENT}>Field Agent</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-background",
              "hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="text-brand hover:underline font-medium"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
