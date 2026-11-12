import type { DashboardMetrics } from "@/types/database";
import { requireSupabase } from "./helpers";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const client = requireSupabase();
  const { data, error } = await client.from("dashboard_metrics").select("*").single();
  if (error) throw error;
  const { data: attendees, error: attendeesError } = await client.from("attendees").select("seats_reserved,attendance_status,payment_status,circles(name)");
  if (attendeesError) throw attendeesError;
  const total_attendees = (attendees ?? []).filter(a => a.attendance_status !== "Cancelado").reduce((sum,a) => sum + Math.max(1,Number(a.seats_reserved) || 1),0);
  const courtesy = (attendees ?? []).filter(a => a.attendance_status !== "Cancelado" && a.payment_status === "Invitación");
  const invited_registrations = courtesy.length;
  const invited_attendees = courtesy.reduce((sum,a) => sum + Math.max(1,Number(a.seats_reserved) || 1),0);
  const groups = new Map<string,{circle:string;registrations:number;people:number}>();
  for (const attendee of attendees ?? []) {
    if (attendee.attendance_status === "Cancelado") continue;
    const relation = attendee.circles as unknown as {name:string}|null;
    const circle = relation?.name?.trim() || "Sin círculo asignado";
    const group = groups.get(circle) ?? {circle,registrations:0,people:0};
    group.registrations += 1;
    group.people += Math.max(1,Number(attendee.seats_reserved)||1);
    groups.set(circle,group);
  }
  const circles_summary = [...groups.values()].sort((a,b)=>b.people-a.people||a.circle.localeCompare(b.circle,"es"));
  return { ...(data as DashboardMetrics), total_attendees, invited_registrations, invited_attendees, circles_summary };
}
