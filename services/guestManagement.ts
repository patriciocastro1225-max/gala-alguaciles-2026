import type { Attendee } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

export async function updateAttendeeProfile(
  id: string,
  payload: Partial<Pick<
    Attendee,
    | "full_name"
    | "email"
    | "phone"
    | "companion_name"
    | "institution"
    | "position_title"
    | "protocol_category"
    | "payment_status"
    | "attendance_status"
    | "dietary_notes"
    | "notes"
    | "table_id"
    | "circle_id"
  >>
) {
  const client = requireSupabase();

  const { data, error } = await client
    .from("attendees")
    .update(payload)
    .eq("id", id)
    .select("*, circles(name), gala_tables(name, table_number)")
    .single();

  if (error) throw error;

  await audit("UPDATE", "attendee", id, payload);
  return data as Attendee;
}
