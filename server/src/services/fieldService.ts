import { supabaseAdmin } from "../lib/supabase.js";
import {
  Field,
  FieldUpdate,
  FieldWithStatus,
  ComputedStatus,
  CropStage,
} from "../../../shared/index.js";

// ─── Status Engine ──────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes the status of a field based on its stage and update history.
 *
 * Rules:
 *  - Completed  → stage is Harvested
 *  - At Risk    → stage is Planted/Growing/Ready AND
 *                  (no updates in 7 days OR last note mentions "pest"/"disease")
 *  - Active     → stage is Planted/Growing/Ready AND updated within 7 days
 */
export function computeStatus(
  field: Field,
  latestUpdate: FieldUpdate | null
): ComputedStatus {
  // Rule 1: Harvested fields are always Completed
  if (field.current_stage === CropStage.Harvested) {
    return ComputedStatus.Completed;
  }

  // For Planted/Growing fields, check update recency and content
  if (!latestUpdate) {
    return ComputedStatus.AtRisk; // No updates at all → At Risk
  }

  const daysSinceUpdate =
    Date.now() - new Date(latestUpdate.created_at).getTime();
  const isStale = daysSinceUpdate > SEVEN_DAYS_MS;

  const noteLower = latestUpdate.note.toLowerCase();
  const hasConcerningKeywords =
    noteLower.includes("pest") || noteLower.includes("disease");

  if (isStale || hasConcerningKeywords) {
    return ComputedStatus.AtRisk;
  }

  return ComputedStatus.Active;
}

// ─── Service Methods ────────────────────────────────────────

/**
 * Fetch all fields with their computed status.
 * Optionally filter by assigned_agent_id for non-admin users.
 */
export async function getAllFieldsWithStatus(
  agentId?: string
): Promise<FieldWithStatus[]> {
  let query = supabaseAdmin
    .from("fields")
    .select("*, profiles!assigned_agent_id(full_name)");

  if (agentId) {
    query = query.eq("assigned_agent_id", agentId);
  }

  const { data: fields, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw new Error(`Failed to fetch fields: ${error.message}`);

  // For each field, get the latest update
  const enriched: FieldWithStatus[] = await Promise.all(
    (fields ?? []).map(async (field: any) => {
      const { data: updates } = await supabaseAdmin
        .from("field_updates")
        .select("*")
        .eq("field_id", field.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestUpdate: FieldUpdate | null = updates?.[0] ?? null;

      return {
        ...field,
        computed_status: computeStatus(field as Field, latestUpdate),
        latest_update: latestUpdate,
        assigned_agent_name: field.profiles?.full_name ?? null,
      } as FieldWithStatus;
    })
  );

  return enriched;
}

/**
 * Fetch a single field by ID with its full update history.
 */
export async function getFieldById(
  fieldId: string
): Promise<{ field: FieldWithStatus; updates: FieldUpdate[] } | null> {
  const { data: field, error } = await supabaseAdmin
    .from("fields")
    .select("*, profiles!assigned_agent_id(full_name)")
    .eq("id", fieldId)
    .single();

  if (error || !field) return null;

  const { data: updates } = await supabaseAdmin
    .from("field_updates")
    .select("*")
    .eq("field_id", fieldId)
    .order("created_at", { ascending: false });

  const latestUpdate: FieldUpdate | null = updates?.[0] ?? null;

  return {
    field: {
      ...field,
      computed_status: computeStatus(field as Field, latestUpdate),
      latest_update: latestUpdate,
      assigned_agent_name: (field as any).profiles?.full_name ?? null,
    } as FieldWithStatus,
    updates: (updates ?? []) as FieldUpdate[],
  };
}

/**
 * Create a new field.
 */
export async function createField(payload: {
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage?: CropStage;
  assigned_agent_id?: string;
}): Promise<Field> {
  const { data, error } = await supabaseAdmin
    .from("fields")
    .insert({
      name: payload.name,
      crop_type: payload.crop_type,
      planting_date: payload.planting_date,
      current_stage: payload.current_stage ?? CropStage.Planted,
      assigned_agent_id: payload.assigned_agent_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create field: ${error.message}`);
  return data as Field;
}

/**
 * Add an update to a field.
 */
export async function addFieldUpdate(
  fieldId: string,
  payload: { note: string; stage_at_time: CropStage }
): Promise<FieldUpdate> {
  // Also update the field's current_stage to match
  await supabaseAdmin
    .from("fields")
    .update({ current_stage: payload.stage_at_time })
    .eq("id", fieldId);

  const { data, error } = await supabaseAdmin
    .from("field_updates")
    .insert({
      field_id: fieldId,
      note: payload.note,
      stage_at_time: payload.stage_at_time,
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to add field update: ${error.message}`);
  return data as FieldUpdate;
}
