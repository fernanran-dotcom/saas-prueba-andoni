import { createClient } from "@/lib/supabase/server";
import { createQuote } from "@/lib/quotes/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default async function NewQuotePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo presupuesto</h1>
        <p className="text-sm text-muted-foreground">
          Crea un nuevo presupuesto para un cliente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del presupuesto</CardTitle>
          <CardDescription>
            Rellena los campos para crear el presupuesto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createQuote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <select
                id="client_id"
                name="client_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecciona un cliente</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                ¿No encuentras al cliente?{" "}
                <Link href="/clients/new" className="underline underline-offset-2">
                  créalo aquí
                </Link>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea
                id="concept"
                name="concept"
                placeholder="Describe el servicio o producto..."
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
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Crear presupuesto</Button>
              <Link href="/quotes">
                <Button variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
