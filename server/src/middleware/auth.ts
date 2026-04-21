import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { UserRole, AuthUser } from "../../../shared/index";

// Extend Express Request to include our auth user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware.
 * Verifies the Supabase JWT from the Authorization header
 * and attaches the user's profile (id + role) to the request.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the JWT and get the user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Fetch the user's role from the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      res.status(403).json({ error: "User profile not found" });
      return;
    }

    // Attach user info to the request
    req.user = {
      id: user.id,
      role: profile.role as UserRole,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Role-based access control middleware factory.
 * Usage: requireRole(UserRole.ADMIN)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}
