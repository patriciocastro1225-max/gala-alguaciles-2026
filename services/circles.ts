import type { Circle } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

export async function listCircles(): Promise<Circle[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("circles").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Circle[];
}

export async function saveCircle(payload: Partial<Circle>, id?: string) {
  const client = requireSupabase();
  if (id) {
    const { data, error } = await client.from("circles").update(payload).eq("id", id).select().single();
    if (error) throw error;
    await audit("UPDATE", "circle", id, payload);
    return data as Circle;
  }
  const { data, error } = await client.from("circles").insert(payload).select().single();
  if (error) throw error;
  await audit("CREATE", "circle", data.id, payload);
  return data as Circle;
}

export async function deleteCircle(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("circles").delete().eq("id", id);
  if (error) throw error;
  await audit("DELETE", "circle", id);
}

/**
 * Catálogo completo para el buscador de inscripción.
 * Incluye todos los Círculos / unidades cargados, estén o no confirmados todavía.
 */
export async function listRegistrationCircles(): Promise<Pick<Circle, "id" | "name">[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("circles")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Pick<Circle, "id" | "name">[];
}

/**
 * Consulta pública utilizada por la portada.
 * Muestra únicamente los Círculos que ya tienen participación confirmada,
 * evitando renderizar todo el padrón nacional.
 */
export async function listPublicCircles(): Promise<Circle[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("circles")
    .select("id,name,city,president,confirmed,created_at")
    .eq("confirmed", true)
    .order("city", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Circle[];
}
