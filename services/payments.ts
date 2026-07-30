import type { Payment } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

export async function listPayments(): Promise<Payment[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("payments")
    .select("*, attendees(full_name, circles(name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function savePayment(payload: Partial<Payment>, id?: string) {
  const client = requireSupabase();
  const query = id
    ? client.from("payments").update(payload).eq("id", id)
    : client.from("payments").insert(payload);
  const { data, error } = await query.select("*, attendees(full_name, circles(name))").single();
  if (error) throw error;

  if (payload.attendee_id && payload.status) {
    await client
      .from("attendees")
      .update({ payment_status: payload.status })
      .eq("id", payload.attendee_id);
  }

  await audit(id ? "UPDATE" : "CREATE", "payment", data.id, payload);
  return data as Payment;
}

export async function deletePayment(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("payments").delete().eq("id", id);
  if (error) throw error;
  await audit("DELETE", "payment", id);
}
