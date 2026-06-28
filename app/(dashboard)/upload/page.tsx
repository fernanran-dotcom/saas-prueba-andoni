"use client";

import { useState, useRef } from "react";
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
import { Upload, FileText, Sparkles, AlertCircle, Loader2 } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Pagado");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setExtracted(false);
    setError("");

    if (!file) return;

    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("pdf", file);

      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al extraer datos del PDF");
        setParsing(false);
        return;
      }

      let anyData = false;
      if (data.client_name) { setClientName(data.client_name); anyData = true; }
      if (data.client_email) { setClientEmail(data.client_email); anyData = true; }
      if (data.concept) { setConcept(data.concept); anyData = true; }
      if (data.amount) { setAmount(data.amount); anyData = true; }

      if (anyData) {
        setExtracted(true);
      } else {
        setError("No se pudieron extraer datos automáticamente. Rellena los campos manualmente.");
      }
    } catch {
      setError("Error de conexión al extraer datos. Rellena los campos manualmente.");
    }
    setParsing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedFile) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("pdf", selectedFile);
      fd.append("client_name", clientName);
      fd.append("client_email", clientEmail);
      fd.append("concept", concept);
      fd.append("amount", amount);
      fd.append("payment_status", paymentStatus);
      if (paymentStatus === "Parcial") {
        const paidInput = document.getElementById("paid_amount") as HTMLInputElement;
        if (paidInput?.value) fd.append("paid_amount", paidInput.value);
      }

      const res = await fetch("/api/upload-quote", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar el presupuesto");
        setSubmitting(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Error de conexión al guardar el presupuesto");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Subir presupuesto PDF</h1>
        <p className="text-sm text-muted-foreground">
          Los datos del cliente, concepto e importe se extraen automáticamente del contenido del PDF.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del presupuesto</CardTitle>
          <CardDescription>
            Revisa y edita la información extraída antes de guardar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf">Archivo PDF</Label>
              <Input
                ref={fileInputRef}
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
                  Extrayendo datos del PDF...
                </p>
              )}
              {selectedFile && !parsing && extracted && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Datos extraídos automáticamente ✓
                </p>
              )}
              {error && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="client_name">
                Cliente {extracted ? <span className="text-xs text-green-600">(extraído)</span> : ""}
              </Label>
              <Input
                id="client_name"
                name="client_name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
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
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea
                id="concept"
                name="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Describe el servicio o producto"
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
                placeholder="0.00"
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

            <Button type="submit" className="w-full" disabled={!selectedFile || parsing || submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Guardar presupuesto</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
