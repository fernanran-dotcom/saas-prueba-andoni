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
import { Upload, FileText } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Pagado");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Subir presupuesto PDF</h1>
        <p className="text-sm text-muted-foreground">
          Sube un PDF y los datos se rellenarán automáticamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del presupuesto</CardTitle>
          <CardDescription>
            El cliente se creará automáticamente si no existe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={uploadQuotePdf} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf">Archivo PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pdf"
                  name="pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
                />
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre del cliente *</Label>
              <Input id="client_name" name="client_name" placeholder="Ej: María García" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Email del cliente</Label>
              <Input id="client_email" name="client_email" type="email" placeholder="cliente@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea id="concept" name="concept" placeholder="Describe el servicio..." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Importe (€)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required />
            </div>

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

            <Button type="submit" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Subir presupuesto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
