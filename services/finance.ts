import { requireSupabase } from "./helpers";
import { getAdminPaymentConfig } from "./paymentConfig";

export type FinancialAttendee = {
  attendee_id: string;
  full_name: string;
  payment_status: string;
  attendance_status: string;
  circle_id: string | null;
  circle_name: string | null;
  seats_reserved: number;
  paid_amount: number;
  expected_amount: number;
  balance: number;
};

export async function listFinancialSummary(): Promise<FinancialAttendee[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("financial_attendee_summary")
    .select("*")
    .order("full_name");

  if (error) throw error;
  const [{ data: attendees, error: attendeeError }, config] = await Promise.all([
    client.from("attendees").select("id,seats_reserved"),
    getAdminPaymentConfig(),
  ]);
  if (attendeeError) throw attendeeError;
  const seatsById = new Map((attendees ?? []).map(a => [a.id, Math.max(1, Number(a.seats_reserved) || 1)]));
  const unitPrice = Number(config.dinner_price) || 45000;
  return (data ?? []).map(row => {
    const seats = seatsById.get(row.attendee_id) ?? 1;
    const expected = row.payment_status === "Invitación" ? 0 : seats * unitPrice;
    const paid = Number(row.paid_amount) || 0;
    return { ...row, seats_reserved: seats, expected_amount: expected, paid_amount: paid, balance: Math.max(0, expected - paid) };
  }) as FinancialAttendee[];
}

export async function getAdhesionAmount(): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("event_config")
    .select("adhesion_amount")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return Number(data?.adhesion_amount ?? 75000);
}

export async function saveAdhesionAmount(amount: number) {
  const client = requireSupabase();
  const { error } = await client
    .from("event_config")
    .update({ adhesion_amount: Math.max(0, Math.round(amount)) })
    .eq("id", 1);

  if (error) throw error;
}
