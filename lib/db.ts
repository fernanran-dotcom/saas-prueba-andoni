export type Client = {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  email: string;
};

export type Quote = {
  id: string;
  user_id: string;
  client_id: string;
  created_at: string;
  concept: string;
  amount: number;
  status: "Borrador" | "Enviado" | "Aceptado" | "Rechazado";
  payment_status: "Pendiente" | "Parcial" | "Pagado";
  paid_amount: number | null;
  file_url: string | null;
  file_name: string | null;
  clients?: { name: string } | null;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  quote_id: string | null;
  created_at: string;
  due_date: string;
  concept: string;
  amount: number;
  status: "Pendiente de cobro" | "Cobrada";
  clients?: { name: string } | null;
};
