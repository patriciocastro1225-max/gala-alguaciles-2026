import { requireSupabase } from "./helpers";

export type FinancialAttendee = {
  attendee_id: string;
  full_name: string;
  payment_status: string;
  attendance_status: string;
  circle_id: string | null;
  circle_name: string | null;
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
  return (data ?? []) as FinancialAttendee[];
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
