import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Polyfill DOMMatrix for Node.js (required by pdf-parse/pdf.js)
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-expect-error minimal DOMMatrix shim for pdf.js
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    constructor(init?: string | number[]) {
      if (typeof init === "string") {
        const parts = init.replace(/matrix3?d?\s*\(/, "").replace(/\)/, "").split(/[\s,]+/).map(Number);
        if (parts.length === 6) {
          this.a = parts[0]; this.b = parts[1];
          this.c = parts[2]; this.d = parts[3];
          this.e = parts[4]; this.f = parts[5];
        }
      }
    }
    translate(tx = 0, ty = 0, tz = 0) { return this; }
    scale(sx = 1, sy = 1) { return this; }
    rotate(angle = 0) { return this; }
    multiply(other: DOMMatrix) { return this; }
    flipX() { return this; }
    flipY() { return this; }
    inverse() { return this; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
    toString() { return "matrix(1,0,0,1,0,0)"; }
    static fromMatrix(m: DOMMatrix) { return new DOMMatrix(); }
    static fromFloat32Array(a: Float32Array) { return new DOMMatrix(); }
    static fromFloat64Array(a: Float64Array) { return new DOMMatrix(); }
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
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
