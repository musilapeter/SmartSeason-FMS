// ─── Enums (const-style for TS6+ erasableSyntaxOnly compatibility) ───

export const UserRole = {
  ADMIN: "ADMIN",
  FIELD_AGENT: "FIELD_AGENT",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CropStage = {
  Planted: "Planted",
  Growing: "Growing",
  Harvested: "Harvested",
} as const;
export type CropStage = (typeof CropStage)[keyof typeof CropStage];

export const ComputedStatus = {
  Active: "Active",
  AtRisk: "At Risk",
  Completed: "Completed",
} as const;
export type ComputedStatus = (typeof ComputedStatus)[keyof typeof ComputedStatus];

// ─── Interfaces ─────────────────────────────────────────

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Field {
  id: string;
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: CropStage;
  assigned_agent_id: string | null;
  created_at: string;
}

export interface FieldUpdate {
  id: string;
  field_id: string;
  note: string;
  stage_at_time: CropStage;
  created_at: string;
}

/** Field enriched with computed status and optional latest update */
export interface FieldWithStatus extends Field {
  computed_status: ComputedStatus;
  latest_update: FieldUpdate | null;
  assigned_agent_name?: string;
}

// ─── API Types ──────────────────────────────────────────

export interface CreateFieldPayload {
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage?: CropStage;
  assigned_agent_id?: string;
}

export interface CreateFieldUpdatePayload {
  note: string;
  stage_at_time: CropStage;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface AuthUser {
  id: string;
  role: UserRole;
}
