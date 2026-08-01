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
  const cleanCode = code.trim();
  if (!cleanCode) throw new Error("Ingrese o escanee un código QR.");

  const { data, error } = await client.rpc("check_in_attendee", {
    p_qr_code: cleanCode,
  });

  if (error) {
    const message = error.message ?? "No fue posible registrar el ingreso.";
    if (message.includes("ya registró")) throw new Error("Este asistente ya registró su ingreso.");
    if (message.includes("no encontrado")) throw new Error("Código no encontrado.");
    throw new Error(message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Código no encontrado.");

  return {
    ...row,
    circles: row.circle_name ? { name: row.circle_name } : null,
    gala_tables: row.table_name
      ? { name: row.table_name, table_number: row.table_number }
      : null,
  } as Attendee;
}

export async function regenerateQr(id: string) {
  const client = requireSupabase();
  const token = `GALA2026-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
  const { data, error } = await client.from("attendees").update({ qr_code: token }).eq("id", id).select(select).single();
  if (error) throw error;
  await audit("REGENERATE_QR", "attendee", id, { qr_code: token });
  return data as Attendee;
}
