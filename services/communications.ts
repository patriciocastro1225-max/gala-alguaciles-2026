import { requireSupabase } from "./helpers";

export type DeliveryLog = {
  id: string;
  attendee_id: string | null;
  campaign_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_key: string | null;
  provider: string;
  provider_message_id: string | null;
  status: "Enviado" | "Error";
  error_message: string | null;
  sent_at: string;
};

export type Campaign = {
  id: string;
  subject: string;
  body: string | null;
  segment: string;
  recipients: number;
  failed: number;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export async function listDeliveryLogs(): Promise<DeliveryLog[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_delivery_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as DeliveryLog[];
}

export async function listCampaigns(): Promise<Campaign[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as Campaign[];
}

export async function createCampaign(payload: {
  subject: string;
  body: string;
  segment: string;
  recipients: number;
  failed: number;
  status: "Enviado" | "Error";
}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_campaigns")
    .insert({
      ...payload,
      provider: "Resend",
      sent_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Campaign;
}

export async function saveDeliveryLogs(
  campaignId: string,
  subject: string,
  templateKey: string,
  deliveries: Array<{
    attendee_id: string;
    email: string;
    name: string;
    ok: boolean;
    id?: string | null;
    error?: string | null;
  }>
) {
  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();

  const rows = deliveries.map((delivery) => ({
    attendee_id: delivery.attendee_id,
    campaign_id: campaignId,
    recipient_email: delivery.email,
    recipient_name: delivery.name,
    subject,
    template_key: templateKey,
    provider: "Resend",
    provider_message_id: delivery.id ?? null,
    status: delivery.ok ? "Enviado" : "Error",
    error_message: delivery.error ?? null,
    sent_by: sessionData.session?.user.id ?? null,
  }));

  if (!rows.length) return;

  const { error } = await client
    .from("email_delivery_log")
    .insert(rows);

  if (error) throw error;
}
