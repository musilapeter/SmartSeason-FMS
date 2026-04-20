import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return; // prevents duplicate requests

    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);

    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();

    // Validation
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate("/");
        return;
      }

      const fullName = String(form.get("full_name") || "").trim();
      if (!fullName) {
        setError("Full name is required.");
        setLoading(false);
        return;
      }

      await signUp(email, password, fullName);

      setSuccess(
        "Account created successfully. Check your email to confirm your account."
      );

      setMode("login");
    } catch (err: any) {
      if (err?.status === 429) {
        setError("Too many requests. Please wait and try again.");
      } else {
        setError(err?.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyles = cn(
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand/30",
    "placeholder:text-text-muted"
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10">
            <Sprout className="h-7 w-7 text-brand" />
          </div>

          <h1 className="text-xl font-bold text-text-primary">
            SmartSeason
          </h1>

          <p className="mt-1 text-sm text-text-muted">
            Field Monitoring System
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg border border-border bg-surface p-1">
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (loading) return;
                setMode(tab);
                setError("");
                setSuccess("");
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
          <div className="mb-4 rounded-lg border border-status-at-risk/20 bg-status-at-risk-bg px-3 py-2.5 text-sm text-status-at-risk">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="full_name"
                className="mb-1.5 block text-sm text-text-secondary"
              >
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                required
                placeholder="John Doe"
                className={inputStyles}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm text-text-secondary"
            >
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

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm text-text-secondary"
            >
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
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-background",
              "transition-colors hover:bg-brand-hover",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Bottom switch */}
        <p className="mt-6 text-center text-xs text-text-muted">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}

          <button
            type="button"
            onClick={() => {
              if (loading) return;

              setMode(
                mode === "login" ? "signup" : "login"
              );

              setError("");
              setSuccess("");
            }}
            className="font-medium text-brand hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}