import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Receipt, Users, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { data: acceptedQuotes } = await supabase
    .from("quotes")
    .select("amount")
    .eq("user_id", user!.id)
    .eq("status", "Aceptado");

  const totalAcceptedQuotes = acceptedQuotes?.reduce((sum, q) => sum + Number(q.amount), 0) ?? 0;

  const { data: pendingInvoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("user_id", user!.id)
    .eq("status", "Pendiente de cobro");

  const totalPendingInvoices = pendingInvoices?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

  const { count: draftQuotes } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "Borrador");

  const cards = [
    {
      title: "Total Presupuestos Aceptados",
      value: `${totalAcceptedQuotes.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`,
      icon: FileText,
    },
    {
      title: "Total Facturas Pendientes",
      value: `${totalPendingInvoices.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`,
      icon: Receipt,
    },
    {
      title: "Clientes",
      value: clientsCount ?? 0,
      icon: Users,
    },
    {
      title: "Borradores Activos",
      value: draftQuotes ?? 0,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
