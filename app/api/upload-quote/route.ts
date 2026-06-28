import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();

    const clientName = formData.get("client_name") as string;
    const clientEmail = formData.get("client_email") as string;

    let existingClientId: string | null = null;
    if (clientEmail) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .eq("email", clientEmail)
        .maybeSingle();
      if (existing) {
        existingClientId = existing.id;
      }
    }

    let clientId = existingClientId;
    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({ user_id: user.id, name: clientName, email: clientEmail || null })
        .select("id")
        .single();
      if (clientError) {
        return NextResponse.json({ error: clientError.message }, { status: 400 });
      }
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
      if (uploadError) {
        return NextResponse.json({
          error: uploadError.message === "Bucket not found"
            ? "El bucket 'quote-pdfs' no existe en Supabase Storage. Créalo en Supabase Dashboard > Storage > New Bucket."
            : `Error al subir el PDF: ${uploadError.message}`,
        }, { status: 400 });
      }

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
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al guardar el presupuesto: ${message}` },
      { status: 500 }
    );
  }
}
