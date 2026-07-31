import type { Attendee, GalaTable } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

export async function listTables(): Promise<GalaTable[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("table_occupancy").select("*").order("table_number");
  if (error) throw error;
  return (data ?? []) as GalaTable[];
}

export async function listTableAttendees(): Promise<Attendee[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("attendees")
    .select("*, circles(name), gala_tables(name, table_number)")
    .neq("attendance_status", "Cancelado")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as Attendee[];
}

export async function assignTable(attendeeId: string, tableId: string | null) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("attendees")
    .update({ table_id: tableId })
    .eq("id", attendeeId)
    .select("*, circles(name), gala_tables(name, table_number)")
    .single();
  if (error) throw error;
  await audit("ASSIGN_TABLE", "attendee", attendeeId, { table_id: tableId });
  return data as Attendee;
}
