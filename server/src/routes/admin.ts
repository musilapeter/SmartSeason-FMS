import { Router, Request, Response } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { supabaseAdmin } from "../lib/supabase";
import { UserRole } from "../../../shared/index";

const router = Router();

// ─── Admin Only Protection ──────────────────────────────────
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

/**
 * POST /api/admin/users
 * Creates a new user (Field Agent by default)
 */
router.post("/users", async (req: Request, res: Response) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // 1. Create the user in Supabase Auth via the Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the user since the admin created it
      user_metadata: {
        full_name,
        role: role || UserRole.FIELD_AGENT,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth creation failed:", authError);
      res.status(400).json({ error: authError?.message || "Failed to create user" });
      return;
    }

    // Since our database trigger handles pushing the profile to public.profiles,
    // we don't need to manually insert into the profiles table here.
    
    // We fetch the newly created profile so we can return it
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.warn("User created, but profile could not be fetched", profileError);
    }

    res.status(201).json({ data: profile || authData.user, error: null });
  } catch (err: any) {
    console.error("POST /admin/users error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * GET /api/admin/users
 * Lists all users with their roles
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: profiles, error: null });
  } catch (err: any) {
    console.error("GET /admin/users error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
