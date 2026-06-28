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
    payment_status: "Pendiente",
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

export async function updatePaymentStatus(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const paymentStatus = formData.get("payment_status") as string;
  const paidAmountRaw = formData.get("paid_amount") as string | null;

  const update: Record<string, string | number | null> = {
    payment_status: paymentStatus,
  };

  if (paymentStatus === "Pagado") {
    update.paid_amount = null;
  } else if (paymentStatus === "Parcial" && paidAmountRaw) {
    update.paid_amount = parseFloat(paidAmountRaw);
  }

  const { error } = await supabase
    .from("quotes")
    .update(update)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/quotes");
  revalidatePath("/");
}

export async function uploadQuotePdf(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const clientName = formData.get("client_name") as string;
  const clientEmail = formData.get("client_email") as string;

  // Create or find client
  let clientId: string;
  if (clientEmail) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .eq("email", clientEmail)
      .maybeSingle();
    if (existing) {
      clientId = existing.id;
    }
  }

  if (!clientId!) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({ user_id: user.id, name: clientName, email: clientEmail || null })
      .select("id")
      .single();
    if (clientError) throw new Error(clientError.message);
    clientId = newClient.id;
  }

  const concept = formData.get("concept") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentStatus = formData.get("payment_status") as string;
  const paidAmountRaw = formData.get("paid_amount") as string | null;

  const pdfFile = formData.get("pdf") as File;
  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (pdfFile && pdfFile.size > 0) {
    const ext = pdfFile.name.split(".").pop() || "pdf";
    fileName = pdfFile.name;
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("quote-pdfs")
      .upload(filePath, pdfFile, {
        contentType: pdfFile.type,
        upsert: false,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from("quote-pdfs")
      .getPublicUrl(filePath);
    fileUrl = urlData.publicUrl;
  }

  const insertData: Record<string, string | number | null> = {
    user_id: user.id,
    client_id: clientId,
    concept,
    amount,
    status: "Aceptado",
    payment_status: paymentStatus,
    file_url: fileUrl,
    file_name: fileName,
  };

  if (paymentStatus === "Parcial" && paidAmountRaw) {
    insertData.paid_amount = parseFloat(paidAmountRaw);
  }

  const { error: insertError } = await supabase.from("quotes").insert(insertData);
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/");
  revalidatePath("/quotes");
  redirect("/");
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
