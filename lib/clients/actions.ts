"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function createClient(formData: FormData) {
  const supabase = await createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClient(formData: FormData) {
  const supabase = await createSupabaseClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
}
