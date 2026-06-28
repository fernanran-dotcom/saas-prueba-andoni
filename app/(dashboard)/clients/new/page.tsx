import { createClient } from "@/lib/supabase/server";
import { createClient as createClientAction } from "@/lib/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Añade un nuevo cliente a tu empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
          <CardDescription>
            Rellena los campos para registrar el cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@email.com"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Crear cliente</Button>
              <Link href="/clients">
                <Button variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
