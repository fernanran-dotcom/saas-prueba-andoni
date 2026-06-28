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
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { markAsPaid, deleteInvoice } from "@/lib/invoices/actions";
import type { Invoice } from "@/lib/db";

const statusColors: Record<Invoice["status"], "default" | "secondary" | "destructive" | "outline"> = {
  "Pendiente de cobro": "secondary",
  Cobrada: "default",
};

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus facturas
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva factura
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las facturas</CardTitle>
          <CardDescription>
            {invoices?.length ?? 0} facturas creadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay facturas todavía. Crea tu primera factura.
                  </TableCell>
                </TableRow>
              ) : (
                invoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.clients?.name ?? "—"}</TableCell>
                    <TableCell>{invoice.concept}</TableCell>
                    <TableCell>
                      {Number(invoice.amount).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[invoice.status as Invoice["status"]]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {invoice.status === "Pendiente de cobro" && (
                          <form action={markAsPaid}>
                            <input type="hidden" name="id" value={invoice.id} />
                            <Button type="submit" variant="outline" size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Cobrada
                            </Button>
                          </form>
                        )}
                        <form action={deleteInvoice}>
                          <input type="hidden" name="id" value={invoice.id} />
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
