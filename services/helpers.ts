import { supabase } from "@/lib/supabase";

export function requireSupabase() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

export async function audit(action: string, entity: string, entityId?: string, details?: unknown) {
  const client = requireSupabase();
  const { data } = await client.auth.getUser();
  await client.from("audit_log").insert({
    user_id: data.user?.id ?? null,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}
