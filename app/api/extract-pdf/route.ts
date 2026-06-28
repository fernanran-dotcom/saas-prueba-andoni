import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún PDF" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const { extractText } = await import("unpdf");
    const pdfResult = await extractText(buffer);
    const text = Array.isArray(pdfResult.text) ? pdfResult.text.join("\n") : (pdfResult.text as string);

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ client_name: "", client_email: "", concept: "", amount: "" });
    }

    const result: Record<string, string> = {
      client_name: "",
      client_email: "",
      concept: "",
      amount: "",
    };

    // Extract client name between "DATOS DEL CLIENTE" and the line with Tel.
    const lines = text.split("\n");
    let clientIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/DATOS\s+DEL\s+CLIENTE/i.test(lines[i])) {
        clientIdx = i;
        break;
      }
    }
    if (clientIdx !== -1) {
      const nameLines: string[] = [];
      for (let i = clientIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || /^Tel\.|^Email|^NIF|^CIF|^\|/i.test(line)) break;
        nameLines.push(line);
      }
      if (nameLines.length > 0) {
        result.client_name = nameLines.join(" ").substring(0, 100);
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
