import { supabase, supabaseConfigured } from "@/lib/supabase";

export async function registerAttendee(payload: any) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");

  const { data, error } = await supabase.rpc("register_gala_attendee", {
    p_full_name: payload.full_name,
    p_email: payload.email,
    p_phone: payload.phone,
    p_circle_name: payload.circle_name || null,
    p_attendance_status: payload.attendance_status,
    p_companion_name: payload.companion_name || null,
    p_dietary_notes: payload.dietary_notes || null,
    p_payment_status: payload.payment_status,
    p_notes: payload.notes || null,
  });

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function uploadPaymentReceipt(file: File, attendeeId: string, portalToken: string) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("EL COMPROBANTE DEBE SER PDF, JPG, JPEG O PNG.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("EL COMPROBANTE NO PUEDE SUPERAR 5 MB.");
  }

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
