import type { Payment } from "@/types/database";
import { audit, requireSupabase } from "./helpers";

export async function listPayments(): Promise<Payment[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("payments")
    .select("*, attendees(full_name, email, phone, circles(name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function savePayment(payload: Partial<Payment>, id?: string) {
  const client = requireSupabase();
  const query = id
    ? client.from("payments").update(payload).eq("id", id)
    : client.from("payments").insert(payload);
  const { data, error } = await query.select("*, attendees(full_name, email, phone, circles(name))").single();
  if (error) throw error;

  if (payload.attendee_id && payload.status) {
    await client.from("attendees").update({ payment_status: payload.status }).eq("id", payload.attendee_id);
  }

  await audit(id ? "UPDATE" : "CREATE", "payment", data.id, payload);
  return data as Payment;
}

export async function getPaymentReceiptUrl(path: string) {
  const client = requireSupabase();
  const { data, error } = await client.storage.from("payment-receipts").createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

export async function validatePaymentReceipt(payment: Payment, decision: "Validado" | "Rechazado") {
  const client = requireSupabase();
  const paymentStatus = decision === "Validado" ? "Pagado" : "Pendiente";

  const { error } = await client
    .from("payments")
    .update({
      validation_status: decision,
      status: paymentStatus,
      payment_date: decision === "Validado" ? new Date().toISOString().slice(0, 10) : payment.payment_date,
    })
    .eq("id", payment.id);
  if (error) throw error;

  await client.from("attendees").update({ payment_status: paymentStatus }).eq("id", payment.attendee_id);
  await audit("UPDATE", "payment", payment.id, { validation_status: decision, status: paymentStatus });
}

export async function deletePayment(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("payments").delete().eq("id", id);
  if (error) throw error;
  await audit("DELETE", "payment", id);
}

export async function uploadAdminPaymentReceipt(paymentId:string,attendeeId:string,file:File){
  const allowed=["application/pdf","image/jpeg","image/png"];
  if(!allowed.includes(file.type))throw new Error("El comprobante debe ser PDF, JPG o PNG.");
  if(file.size>5*1024*1024)throw new Error("El comprobante no puede superar 5 MB.");
  const client=requireSupabase();
  const extension=file.type==="application/pdf"?"pdf":file.type==="image/png"?"png":"jpg";
  const path=`admin/${attendeeId}/${paymentId}-${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await client.storage.from("payment-receipts").upload(path,file,{contentType:file.type,upsert:false});
  if(uploadError)throw uploadError;
  const {error}=await client.from("payments").update({receipt_path:path,receipt_original_name:file.name,validation_status:"Pendiente"}).eq("id",paymentId);
  if(error){await client.storage.from("payment-receipts").remove([path]);throw error;}
  await audit("UPLOAD_RECEIPT","payment",paymentId,{receipt_path:path,receipt_original_name:file.name});
}
