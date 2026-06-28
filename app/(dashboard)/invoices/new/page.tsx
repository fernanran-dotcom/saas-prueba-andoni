import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/invoices/actions";
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
import Link from "next/link";

export default async function NewInvoicePage(props: {
  searchParams: Promise<{ quote_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [clientsResult, acceptedQuotesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user!.id)
      .order("name"),
    supabase
      .from("quotes")
      .select("id, concept, amount, client_id, clients(name)")
      .eq("user_id", user!.id)
      .eq("status", "Aceptado"),
  ]);

  const clients = clientsResult.data;
  const acceptedQuotes = acceptedQuotesResult.data;

  // If a quote_id is provided, pre-select it
  const preselectedQuote = searchParams.quote_id
    ? acceptedQuotes?.find((q) => q.id === searchParams.quote_id)
    : null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">
          {preselectedQuote ? "Facturar presupuesto" : "Nueva factura"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {preselectedQuote
            ? "Genera una factura a partir del presupuesto aceptado"
            : "Crea una nueva factura"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la factura</CardTitle>
          <CardDescription>
            Rellena los campos para crear la factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInvoice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={preselectedQuote?.client_id ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecciona un cliente</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {!preselectedQuote && acceptedQuotes && acceptedQuotes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="quote_id">Generar desde presupuesto (opcional)</Label>
                <select
                  id="quote_id"
                  name="quote_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Sin presupuesto asociado</option>
                  {acceptedQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {(q.clients as unknown as { name: string }[])?.[0]?.name ?? "—"} — {q.concept} —{" "}
                      {Number(q.amount).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {preselectedQuote && (
              <input type="hidden" name="quote_id" value={preselectedQuote.id} />
            )}

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea
                id="concept"
                name="concept"
                placeholder="Describe el servicio o producto..."
                defaultValue={preselectedQuote?.concept ?? ""}
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
                placeholder="0.00"
                defaultValue={preselectedQuote?.amount ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de vencimiento</Label>
              <Input id="due_date" name="due_date" type="date" required />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Crear factura</Button>
              <Link href="/invoices">
                <Button variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
