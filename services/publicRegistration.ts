import { supabase, supabaseConfigured } from "@/lib/supabase";

export async function registerAttendee(_payload: any): Promise<never> {
  throw new Error("EVENTO COMPLETO. LAS INSCRIPCIONES ESTÁN CERRADAS.");
}

export async function uploadPaymentReceipt(file: File, attendeeId: string, portalToken: string, amount: number) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) throw new Error("EL COMPROBANTE DEBE SER PDF, JPG, JPEG O PNG.");
  if (file.size > 5 * 1024 * 1024) throw new Error("EL COMPROBANTE NO PUEDE SUPERAR 5 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `pending/${attendeeId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error: registerError } = await supabase.rpc("register_payment_receipt", {
    p_attendee_id: attendeeId,
    p_portal_token: portalToken,
    p_receipt_path: path,
    p_original_name: file.name,
    p_amount: amount,
  });

  if (registerError) throw new Error(registerError.message);
  return path;
}

export async function getGuestPortal(code: string, token: string) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.rpc("get_guest_portal", {
    p_registration_code: code,
    p_portal_token: token,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Portal no encontrado.");
  return data;
}
