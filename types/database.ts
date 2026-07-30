export type Circle = {
  id: string;
  name: string;
  city: string | null;
  president: string | null;
  confirmed: boolean;
  created_at?: string;
};

export type GalaTable = {
  id: string;
  table_number: number;
  name: string;
  capacity: number;
  zone: "Autoridades" | "Central" | "General";
  occupied?: number;
  available?: number;
};

export type Attendee = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  companion_name: string | null;
  payment_status: "Pagado" | "Pendiente" | "Parcial" | "Invitación";
  attendance_status: "Confirmado" | "Pendiente" | "Cancelado";
  checked_in: boolean;
  checkin_at: string | null;
  qr_code: string;
  dietary_notes: string | null;
  notes: string | null;
  circle_id: string | null;
  table_id: string | null;
  circles?: { name: string } | null;
  gala_tables?: { name: string; table_number: number } | null;
};

export type Payment = {
  id: string;
  attendee_id: string;
  amount: number;
  method: "Transferencia" | "Webpay" | "Efectivo" | "Invitación";
  status: "Pagado" | "Pendiente" | "Parcial";
  payment_date: string | null;
  reference: string | null;
  attendees?: { full_name: string; circles?: { name: string } | null } | null;
};

export type DashboardMetrics = {
  registered: number;
  confirmed: number;
  checked_in: number;
  payment_pending: number;
  collected: number;
  total_tables: number;
  total_capacity: number;
  assigned_seats: number;
};
