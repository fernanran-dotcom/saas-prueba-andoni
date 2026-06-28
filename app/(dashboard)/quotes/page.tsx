import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Plus, Trash2, Upload, FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { updateQuoteStatus, updatePaymentStatus, deleteQuote } from "@/lib/quotes/actions";
import type { Quote } from "@/lib/db";

const statusColors: Record<Quote["status"], "default" | "secondary" | "destructive" | "outline"> = {
  Borrador: "outline",
  Enviado: "secondary",
  Aceptado: "default",
  Rechazado: "destructive",
};

const paymentColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost"> = {
  Pagado: "default",
  Parcial: "secondary",
  Pendiente: "outline",
};

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus presupuestos y cobros
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Subir PDF
            </Button>
          </Link>
          <Link href="/quotes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo presupuesto
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los presupuestos</CardTitle>
          <CardDescription>
            {quotes?.length ?? 0} presupuestos creados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cobro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay presupuestos todavía. Crea tu primer presupuesto o sube un PDF.
                  </TableCell>
                </TableRow>
              ) : (
                quotes?.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{quote.clients?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{quote.concept}</TableCell>
                    <TableCell>
                      {Number(quote.amount).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(quote.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell>
                      {quote.file_url ? (
                        <a
                          href={quote.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[quote.status as Quote["status"]]}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={paymentColors[quote.payment_status] ?? "outline"}>
                          {quote.payment_status === "Parcial" && quote.paid_amount
                            ? `Parcial (${Number(quote.paid_amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" })})`
                            : quote.payment_status}
                        </Badge>
                        {quote.payment_status !== "Pagado" && (
                          <form action={updatePaymentStatus}>
                            <input type="hidden" name="id" value={quote.id} />
                            <input type="hidden" name="payment_status" value="Pagado" />
                            <Button type="submit" variant="ghost" size="xs" className="h-6 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Cobrar
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {quote.status === "Borrador" && (
                          <form action={updateQuoteStatus}>
                            <input type="hidden" name="id" value={quote.id} />
                            <input type="hidden" name="status" value="Enviado" />
                            <Button type="submit" variant="outline" size="sm">
                              Enviar
                            </Button>
                          </form>
                        )}
                        {quote.status === "Enviado" && (
                          <form action={updateQuoteStatus}>
                            <input type="hidden" name="id" value={quote.id} />
                            <input type="hidden" name="status" value="Aceptado" />
                            <Button type="submit" variant="outline" size="sm">
                              Aceptar
                            </Button>
                          </form>
                        )}
                        <form action={deleteQuote}>
                          <input type="hidden" name="id" value={quote.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
