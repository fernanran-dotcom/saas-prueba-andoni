"use client";

import { useRef, useState } from "react";
import { uploadQuotePdf } from "@/lib/quotes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Sparkles } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Pagado");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [parsing, setParsing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setExtracted(false);

    if (!file) return;

    setParsing(true);

    // Try client-side extraction first (works for text-based PDFs)
    let foundName = "", foundEmail = "", foundConcept = "", foundAmount = "";
    try {
      const text = await file.text();
      if (text.length > 50) {
        const clientSection = text.match(/DATOS\s+DEL\s+CLIENTE\s*([\s\S]*?)(?:Tel\.|Email|NIF|CIF|\||$)/i);
        if (clientSection) {
          foundName = clientSection[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim().substring(0, 100);
        } else {
          const labelMatch = text.match(/(?:Cliente:|Nombre:|Empresa:)\s*(.+)/i);
          if (labelMatch) foundName = labelMatch[1].trim().substring(0, 100);
        }

        const emailMatch = text.match(/([\w@.+\-]+@[\w.\-]+\.[a-z]{2,})/i);
        if (emailMatch) foundEmail = emailMatch[1].trim();

        const descMatch = text.match(/DESCRIPCI[ÓO]N:\s*([\s\S]*?)(?:Concepto|Ud\.|SUB-TOTAL|TOTAL)/i);
        if (descMatch) {
          foundConcept = descMatch[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim().substring(0, 200);
        }

        const totalMatch = text.match(/^\s*TOTAL\s*[:.]?\s*([\d.,]+)/im);
        if (totalMatch) {
          const num = parseFloat(totalMatch[1].replace(/\./g, "").replace(",", "."));
          if (!isNaN(num) && num > 0) foundAmount = num.toString();
        }
      }
    } catch {
      // client-side extraction failed
    }

    // Try server-side extraction if client-side got nothing
    if (!foundName && !foundAmount) {
      try {
        const fd = new FormData();
        fd.append("pdf", file);
        const res = await fetch("/api/extract-pdf", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          foundName = data.client_name || foundName;
          foundEmail = data.client_email || foundEmail;
          foundConcept = data.concept || foundConcept;
          foundAmount = data.amount || foundAmount;
        }
      } catch {
        // server extraction also failed
      }
    }

    if (foundName) setClientName(foundName);
    if (foundEmail) setClientEmail(foundEmail);
    if (foundConcept) setConcept(foundConcept);
    if (foundAmount) setAmount(foundAmount);
    if (foundName || foundAmount) setExtracted(true);

    setParsing(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Subir presupuesto PDF</h1>
        <p className="text-sm text-muted-foreground">
          Los datos del cliente, concepto e importe se extraen del PDF. Puedes editarlos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos extraídos del PDF</CardTitle>
          <CardDescription>
            Revisa y edita la información antes de guardar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={uploadQuotePdf} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf">Archivo PDF</Label>
              <Input
                id="pdf"
                name="pdf"
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={handleFileChange}
                className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
              />
              {parsing && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  Extrayendo datos del contenido del PDF...
                </p>
              )}
              {selectedFile && !parsing && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  {extracted ? " — datos extraídos ✓" : " — extraer datos automáticamente no disponible, rellena manualmente ↓"}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="client_name">Cliente</Label>
              <Input
                id="client_name"
                name="client_name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Extraído del contenido del PDF"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Email del cliente</Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Extraído del contenido del PDF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea
                id="concept"
                name="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Extraído del contenido del PDF"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Importe (€)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Extraído del contenido del PDF"
                required
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Estado de pago</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_status"
                    value="Pagado"
                    checked={paymentStatus === "Pagado"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Pagado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_status"
                    value="Pendiente"
                    checked={paymentStatus === "Pendiente"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Pendiente (total)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_status"
                    value="Parcial"
                    checked={paymentStatus === "Parcial"}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Parcial</span>
                </label>
              </div>
            </div>

            {paymentStatus === "Parcial" && (
              <div className="space-y-2">
                <Label htmlFor="paid_amount">Cantidad cobrada (€)</Label>
                <Input id="paid_amount" name="paid_amount" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!selectedFile || parsing}>
              <Upload className="h-4 w-4 mr-2" />
              Guardar presupuesto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
