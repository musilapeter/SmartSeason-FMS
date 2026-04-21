import { Router, Request, Response } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  getAllFieldsWithStatus,
  getFieldById,
  createField,
  addFieldUpdate,
} from "../services/fieldService";
import { UserRole } from "../../../shared/index";

const router = Router();

// All field routes require authentication
router.use(authenticate);

/**
 * GET /api/fields
 * List all fields with computed status.
 * Admins see all fields; agents see only their assigned fields.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const agentId =
      req.user!.role === UserRole.ADMIN ? undefined : req.user!.id;
    const fields = await getAllFieldsWithStatus(agentId);
    res.json({ data: fields, error: null });
  } catch (err: any) {
    console.error("GET /fields error:", err);
    res.status(500).json({ data: null, error: err.message });
  }
});

/**
 * GET /api/fields/:id
 * Get a single field with full update history.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.id as string;
    const result = await getFieldById(fieldId);

    if (!result) {
      res.status(404).json({ data: null, error: "Field not found" });
      return;
    }

    // Agents can only view their assigned fields
    if (
      req.user!.role === UserRole.FIELD_AGENT &&
      result.field.assigned_agent_id !== req.user!.id
    ) {
      res.status(403).json({ data: null, error: "Access denied" });
      return;
    }

    res.json({ data: result, error: null });
  } catch (err: any) {
    console.error("GET /fields/:id error:", err);
    res.status(500).json({ data: null, error: err.message });
  }
});

/**
 * POST /api/fields
 * Create a new field. Admin only.
 */
router.post(
  "/",
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const field = await createField(req.body);
      res.status(201).json({ data: field, error: null });
    } catch (err: any) {
      console.error("POST /fields error:", err);
      res.status(500).json({ data: null, error: err.message });
    }
  }
);

/**
 * POST /api/fields/:id/updates
 * Add an update to a field. Admin or assigned agent only.
 */
router.post("/:id/updates", async (req: Request, res: Response) => {
  try {
    // Verify the user has access to this field
    const fieldId = req.params.id as string;
    const result = await getFieldById(fieldId);

    if (!result) {
      res.status(404).json({ data: null, error: "Field not found" });
      return;
    }

    if (
      req.user!.role === UserRole.FIELD_AGENT &&
      result.field.assigned_agent_id !== req.user!.id
    ) {
      res.status(403).json({ data: null, error: "Access denied" });
      return;
    }

    const update = await addFieldUpdate(fieldId, req.body);
    res.status(201).json({ data: update, error: null });
  } catch (err: any) {
    console.error("POST /fields/:id/updates error:", err);
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
