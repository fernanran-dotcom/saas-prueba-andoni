import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    const text = data.text;

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ client_name: "", client_email: "", concept: "", amount: "" });
    }

    const result: Record<string, string> = {
      client_name: "",
      client_email: "",
      concept: "",
      amount: "",
    };

    // Extract client name between "DATOS DEL CLIENTE" and "Tel."
    const clientSection = text.match(
      /DATOS\s+DEL\s+CLIENTE\s*([\s\S]*?)(?:Tel\.|Email|NIF|CIF|@|$)/i
    );
    if (clientSection) {
      const rawName = clientSection[1]
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 100);
      if (rawName.length > 2) {
        result.client_name = rawName;
      }
    }

    // Fallback: "Cliente:" label
    if (!result.client_name) {
      for (const label of ["Cliente:", "Nombre:", "Empresa:", "Cliente "]) {
        const idx = text.indexOf(label);
        if (idx !== -1) {
          const after = text.substring(idx + label.length, idx + label.length + 80)
            .split("\n")[0]
            .trim();
          if (after && after.length > 2 && !/^[\d@]+$/.test(after)) {
            result.client_name = after.substring(0, 100);
            break;
          }
        }
      }
    }

    // Extract email
    const emailMatch = text.match(
      /(?:email|correo|e-?mail|e-mail)\s*[:.]?\s*([\w@.+\-]+@[\w.\-]+\.[a-z]{2,})/i
    );
    if (emailMatch) {
      result.client_email = emailMatch[1].trim();
    } else {
      const anyEmail = text.match(/([\w@.+\-]+@[\w.\-]+\.[a-z]{2,})/i);
      if (anyEmail) result.client_email = anyEmail[1].trim();
    }

    // Extract concept after "DESCRIPCIÓN:" until items table
    const descSection = text.match(
      /DESCRIPCI[ÓO]N:\s*([\s\S]*?)(?:Concepto|Ud\.|SUB-TOTAL|TOTAL)/i
    );
    if (descSection) {
      const conceptText = descSection[1]
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 200);
      if (conceptText.length > 5) {
        result.concept = conceptText;
      }
    }

    // Extract total — match "TOTAL" at line start (not column header or SUB-TOTAL)
    const totalMatch = text.match(/^\s*TOTAL\s*[:.]?\s*([\d.,]+)\s*€?/im);
    if (totalMatch) {
      const raw = totalMatch[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        result.amount = num.toString();
      }
    }

    // Fallback: number near €
    if (!result.amount) {
      const euroMatch = text.match(/([\d.,]+)\s*€/);
      if (euroMatch) {
        const raw = euroMatch[1].replace(/\./g, "").replace(",", ".");
        const num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
          result.amount = num.toString();
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al procesar el PDF: ${message}` },
      { status: 500 }
    );
  }
}
