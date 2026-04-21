import { supabase } from "./supabase";
import type {
  FieldWithStatus,
  FieldUpdate,
  CreateFieldPayload,
  CreateFieldUpdatePayload,
  ApiResponse,
  Profile,
} from "@shared/index";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Supabase JWT to every request.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data;
}

// ─── API Methods ────────────────────────────────────────────

export async function fetchFields(): Promise<FieldWithStatus[]> {
  return apiFetch<FieldWithStatus[]>("/fields");
}

export async function fetchField(
  id: string
): Promise<{ field: FieldWithStatus; updates: FieldUpdate[] }> {
  return apiFetch<{ field: FieldWithStatus; updates: FieldUpdate[] }>(
    `/fields/${id}`
  );
}

export async function createField(
  payload: CreateFieldPayload
): Promise<FieldWithStatus> {
  return apiFetch<FieldWithStatus>("/fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addFieldUpdate(
  fieldId: string,
  payload: CreateFieldUpdatePayload
): Promise<FieldUpdate> {
  return apiFetch<FieldUpdate>(`/fields/${fieldId}/updates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Admin Users API ────────────────────────────────────────

export async function fetchUsers(): Promise<Profile[]> {
  return apiFetch<Profile[]>("/admin/users");
}

export async function createAgentUser(
  payload: Partial<Profile> & { email: string; password?: string }
): Promise<Profile> {
  return apiFetch<Profile>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
