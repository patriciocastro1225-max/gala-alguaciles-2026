import type { DashboardMetrics } from "@/types/database";
import { requireSupabase } from "./helpers";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const client = requireSupabase();
  const { data, error } = await client.from("dashboard_metrics").select("*").single();
  if (error) throw error;
  return data as DashboardMetrics;
}
