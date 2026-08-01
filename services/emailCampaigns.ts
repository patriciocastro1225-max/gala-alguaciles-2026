import { requireSupabase } from "./helpers";

export async function saveEmailCampaign(payload: {
  subject: string;
  body: string;
  segment: string;
  recipients: number;
  failed: number;
  status: "Enviado" | "Error";
}) {
  const client = requireSupabase();
  const { error } = await client.from("email_campaigns").insert({
    ...payload,
    provider: "Resend",
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;
}
