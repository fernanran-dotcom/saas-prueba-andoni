"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createQuote(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  const { error } = await supabase.from("quotes").insert({
    user_id: user.id,
    client_id: formData.get("client_id"),
    concept: formData.get("concept"),
    amount: parseFloat(formData.get("amount") as string),
    status: "Borrador",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function updateQuoteStatus(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/quotes");
}

export async function deleteQuote(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/quotes");
}
