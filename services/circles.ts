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
