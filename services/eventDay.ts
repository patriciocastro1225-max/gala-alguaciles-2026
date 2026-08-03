import { audit, requireSupabase } from "./helpers";
import type { Attendee } from "@/types/database";

export type EventIncident = {
  id: string;
  attendee_id: string | null;
  incident_type: string;
  description: string;
  resolved: boolean;
  created_at: string;
};

export async function searchEventAttendees(query: string): Promise<Attendee[]> {
  const client = requireSupabase();
  const clean = query.trim();

  let request = client
    .from("attendees")
    .select("*, circles(name), gala_tables(name, table_number)")
    .neq("attendance_status", "Cancelado")
    .order("full_name")
    .limit(30);

  if (clean) {
    request = request.or(
      `full_name.ilike.%${clean}%,email.ilike.%${clean}%,phone.ilike.%${clean}%,qr_code.ilike.%${clean}%`
    );
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as Attendee[];
}

export async function checkInCompanion(attendeeId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("check_in_companion", {
    p_attendee_id: attendeeId,
  });

  if (error) throw new Error(error.message ?? "No fue posible acreditar al acompañante.");
  return Array.isArray(data) ? data[0] : data;
}

export async function saveAccessNote(attendeeId: string, accessNotes: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("attendees")
    .update({ access_notes: accessNotes.trim() || null })
    .eq("id", attendeeId);

  if (error) throw error;
  await audit("UPDATE_ACCESS_NOTE", "attendee", attendeeId, {
    access_notes: accessNotes.trim() || null,
  });
}

export async function createIncident(payload: {
  attendee_id?: string | null;
  incident_type: string;
  description: string;
}) {
  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();

  const { data, error } = await client
    .from("event_incidents")
    .insert({
      attendee_id: payload.attendee_id ?? null,
      incident_type: payload.incident_type,
      description: payload.description,
      created_by: sessionData.session?.user.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  await audit("CREATE", "event_incident", data.id, payload);
  return data as EventIncident;
}

export async function listIncidents(): Promise<EventIncident[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("event_incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as EventIncident[];
}

export async function resolveIncident(id: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("event_incidents")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  await audit("RESOLVE", "event_incident", id);
}
