import type { Attendee } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

const select = `
  *,
  circles(name),
  gala_tables(name, table_number)
`;

export async function listAttendees(): Promise<Attendee[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("attendees")
    .select(select)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Attendee[];
}

export async function createAttendee(payload: Partial<Attendee>) {
  const client = requireSupabase();
  const { data, error } = await client.from("attendees").insert(payload).select(select).single();
  if (error) throw error;
  await audit("CREATE", "attendee", data.id, payload);
  return data as Attendee;
}

export async function updateAttendee(id: string, payload: Partial<Attendee>) {
  const client = requireSupabase();
  const { data, error } = await client.from("attendees").update(payload).eq("id", id).select(select).single();
  if (error) throw error;
  await audit("UPDATE", "attendee", id, payload);
  return data as Attendee;
}

export async function deleteAttendee(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("attendees").delete().eq("id", id);
  if (error) throw error;
  await audit("DELETE", "attendee", id);
}

export async function checkInByCode(code: string) {
  const client = requireSupabase();
  const { data: attendee, error } = await client
    .from("attendees")
    .select(select)
    .eq("qr_code", code.trim())
    .maybeSingle();
  if (error) throw error;
  if (!attendee) throw new Error("Código no encontrado.");
  if (attendee.checked_in) throw new Error("Este asistente ya registró su ingreso.");

  const { data, error: updateError } = await client
    .from("attendees")
    .update({ checked_in: true, checkin_at: new Date().toISOString() })
    .eq("id", attendee.id)
    .select(select)
    .single();
  if (updateError) throw updateError;
  await audit("CHECK_IN", "attendee", attendee.id);
  return data as Attendee;
}
