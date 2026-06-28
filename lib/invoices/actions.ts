"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  const quoteId = formData.get("quote_id");

  const { error } = await supabase.from("invoices").insert({
    user_id: user.id,
    client_id: formData.get("client_id"),
    quote_id: quoteId || null,
    concept: formData.get("concept"),
    amount: parseFloat(formData.get("amount") as string),
    due_date: formData.get("due_date"),
    status: "Pendiente de cobro",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function markAsPaid(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("invoices")
    .update({ status: "Cobrada" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
}

export async function deleteInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
}
