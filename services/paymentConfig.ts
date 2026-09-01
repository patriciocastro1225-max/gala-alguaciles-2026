import { supabase, supabaseConfigured } from "@/lib/supabase";

export type PaymentConfig = {
  dinner_price: number;
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  bank_rut: string;
  bank_email: string;
  bank_account_holder: string;
};

export const defaultPaymentConfig: PaymentConfig = {
  dinner_price: 45000,
  bank_name: "",
  bank_account_type: "",
  bank_account_number: "",
  bank_rut: "",
  bank_email: "",
  bank_account_holder: "",
};

export async function getPublicPaymentConfig(): Promise<PaymentConfig> {
  if (!supabaseConfigured || !supabase) return defaultPaymentConfig;
  const { data, error } = await supabase.rpc("get_public_payment_config");
  if (error) throw new Error(error.message);
  return { ...defaultPaymentConfig, ...(data || {}) } as PaymentConfig;
}

export async function getAdminPaymentConfig(): Promise<PaymentConfig> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase
    .from("event_config")
    .select("dinner_price,bank_name,bank_account_type,bank_account_number,bank_rut,bank_email,bank_account_holder")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return { ...defaultPaymentConfig, ...(data || {}) } as PaymentConfig;
}

export async function saveAdminPaymentConfig(config: PaymentConfig) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase
    .from("event_config")
    .update({
      dinner_price: Number(config.dinner_price) || 45000,
      bank_name: config.bank_name || null,
      bank_account_type: config.bank_account_type || null,
      bank_account_number: config.bank_account_number || null,
      bank_rut: config.bank_rut || null,
      bank_email: config.bank_email || null,
      bank_account_holder: config.bank_account_holder || null,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}
