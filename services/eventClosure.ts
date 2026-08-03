import { requireSupabase } from "./helpers";

export type FinalMetrics = {
  total_registrados: number;
  confirmados: number;
  acreditados: number;
  acompanantes_registrados: number;
  acompanantes_acreditados: number;
  mesas: number;
  capacidad_total: number;
  recaudado: number;
  pagos_registrados: number;
  incidencias_totales: number;
  incidencias_abiertas: number;
  generado_en: string;
};

export type EventSnapshot = {
  id: string;
  snapshot_name: string;
  snapshot_type: "Cierre" | "Parcial" | "Respaldo";
  metrics: FinalMetrics;
  created_at: string;
};

export async function getFinalMetrics(): Promise<FinalMetrics> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("event_final_metrics");
  if (error) throw error;
  return data as FinalMetrics;
}

export async function createEventSnapshot(
  snapshotName: string,
  snapshotType: "Cierre" | "Parcial" | "Respaldo" = "Cierre"
) {
  const client = requireSupabase();
  const metrics = await getFinalMetrics();
  const { data: sessionData } = await client.auth.getSession();

  const { data, error } = await client
    .from("event_snapshots")
    .insert({
      snapshot_name: snapshotName,
      snapshot_type: snapshotType,
      metrics,
      created_by: sessionData.session?.user.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as EventSnapshot;
}

export async function listEventSnapshots(): Promise<EventSnapshot[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("event_snapshots")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventSnapshot[];
}
