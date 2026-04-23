import { supabase } from "./supabase";
import type {
  Field,
  FieldWithStatus,
  FieldUpdate,
  CreateFieldPayload,
  CreateFieldUpdatePayload,
  Profile,
} from "../types/index";
import { ComputedStatus, CropStage } from "../types/index";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function computeStatus(
  field: Field,
  latestUpdate: FieldUpdate | null
): ComputedStatus {
  if (field.current_stage === CropStage.Harvested) {
    return ComputedStatus.Completed;
  }

  if (!latestUpdate) {
    return ComputedStatus.AtRisk;
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

// ─── API Methods ────────────────────────────────────────────

export async function fetchFields(): Promise<FieldWithStatus[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  // Determine user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const isAgent = profile?.role === "FIELD_AGENT";

  let query = supabase
    .from("fields")
    .select("*, profiles!assigned_agent_id(full_name)")
    .order("created_at", { ascending: false });

  if (isAgent) {
    query = query.eq("assigned_agent_id", userData.user.id);
  }

  const { data: fields, error } = await query;
  if (error) throw new Error(error.message);

  const enriched: FieldWithStatus[] = await Promise.all(
    (fields ?? []).map(async (field: any) => {
      const { data: updates } = await supabase
        .from("field_updates")
        .select("*")
        .eq("field_id", field.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestUpdate = updates?.[0] ?? null;

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

export async function fetchField(
  id: string
): Promise<{ field: FieldWithStatus; updates: FieldUpdate[] }> {
  const { data: field, error } = await supabase
    .from("fields")
    .select("*, profiles!assigned_agent_id(full_name)")
    .eq("id", id)
    .single();

  if (error || !field) throw new Error("Field not found");

  const { data: updates } = await supabase
    .from("field_updates")
    .select("*")
    .eq("field_id", id)
    .order("created_at", { ascending: false });

  const latestUpdate = updates?.[0] ?? null;

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

export async function createField(
  payload: CreateFieldPayload
): Promise<FieldWithStatus> {
  const { data, error } = await supabase
    .from("fields")
    .insert({
      name: payload.name,
      crop_type: payload.crop_type,
      planting_date: payload.planting_date,
      current_stage: payload.current_stage ?? CropStage.Planted,
      assigned_agent_id: payload.assigned_agent_id ?? null,
    })
    .select("*, profiles!assigned_agent_id(full_name)")
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    computed_status: ComputedStatus.AtRisk, // Defaults internally based on missing updates
    latest_update: null,
    assigned_agent_name: (data as any).profiles?.full_name ?? null,
  } as FieldWithStatus;
}

export async function addFieldUpdate(
  fieldId: string,
  payload: CreateFieldUpdatePayload
): Promise<FieldUpdate> {
  // Update field's stage
  await supabase
    .from("fields")
    .update({ current_stage: payload.stage_at_time })
    .eq("id", fieldId);

  const { data, error } = await supabase
    .from("field_updates")
    .insert({
      field_id: fieldId,
      note: payload.note,
      stage_at_time: payload.stage_at_time,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FieldUpdate;
}

export async function fetchUsers(): Promise<Profile[]> {
  // Fetch ALL profiles — RLS self-referencing policies can silently
  // return empty results when filtering server-side, so we filter client-side.
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  if (error) throw new Error(error.message);

  console.log("[fetchUsers] All profiles returned:", data);
  return data as Profile[];
}

export async function createAgentUser(
  _payload: Partial<Profile> & { email: string; password?: string }
): Promise<Profile> {
  // Because we removed the Admin API middleware, creating auth users bypasses the client unless using Supabase Edge Functions or explicit public signup defaults.
  // For simplicity since the pivot, we rely on the `SignUp` component. Admin proxy creation requires service bindings.
  throw new Error("Admin Agent Creation must be done via standard Sign Up or Edge Functions in Native Supabase");
}

export async function fetchBackendHealth(): Promise<{ status: string; message: string }> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Failed to fetch backend health");
  return res.json();
}
