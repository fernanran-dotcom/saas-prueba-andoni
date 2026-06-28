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
import { Plus, Trash2 } from "lucide-react";
import { updateQuoteStatus, deleteQuote } from "@/lib/quotes/actions";
import type { Quote } from "@/lib/db";

const statusColors: Record<Quote["status"], "default" | "secondary" | "destructive" | "outline"> = {
  Borrador: "outline",
  Enviado: "secondary",
  Aceptado: "default",
  Rechazado: "destructive",
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
            Gestiona tus presupuestos
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </Link>
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
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay presupuestos todavía. Crea tu primer presupuesto.
                  </TableCell>
                </TableRow>
              ) : (
                quotes?.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{quote.clients?.name ?? "—"}</TableCell>
                    <TableCell>{quote.concept}</TableCell>
                    <TableCell>
                      {Number(quote.amount).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(quote.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[quote.status as Quote["status"]]}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                        {quote.status === "Aceptado" && (
                          <Link href={`/invoices/new?quote_id=${quote.id}`}>
                            <Button variant="default" size="sm">
                              Facturar
                            </Button>
                          </Link>
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
