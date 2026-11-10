import type { DashboardMetrics } from "@/types/database";
import { requireSupabase } from "./helpers";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const client = requireSupabase();
  const { data, error } = await client.from("dashboard_metrics").select("*").single();
  if (error) throw error;
  const { data: attendees, error: attendeesError } = await client.from("attendees").select("seats_reserved,attendance_status,payment_status");
  if (attendeesError) throw attendeesError;
  const total_attendees = (attendees ?? []).filter(a => a.attendance_status !== "Cancelado").reduce((sum,a) => sum + Math.max(1,Number(a.seats_reserved) || 1),0);
  const courtesy = (attendees ?? []).filter(a => a.attendance_status !== "Cancelado" && a.payment_status === "Invitación");
  const invited_registrations = courtesy.length;
  const invited_attendees = courtesy.reduce((sum,a) => sum + Math.max(1,Number(a.seats_reserved) || 1),0);
  return { ...(data as DashboardMetrics), total_attendees, invited_registrations, invited_attendees };
}
