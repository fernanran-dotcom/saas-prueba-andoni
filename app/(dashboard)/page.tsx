import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingPayments } from "@/components/pending-payments";
import { FileText, Receipt, Users, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return <div className="p-6"><p className="text-muted-foreground">No se pudo obtener el usuario.</p></div>
  }

  const [clientsResult, quotesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("quotes")
      .select("amount, paid_amount, payment_status")
      .eq("user_id", userId),
  ]);

  const clientsCount = clientsResult.count ?? 0;
  const allQuotes = quotesResult.data ?? [];

  const totalBilled = allQuotes.reduce((sum, q) => {
    if (q.payment_status === "Pagado") return sum + Number(q.amount);
    if (q.payment_status === "Parcial" && q.paid_amount) return sum + Number(q.paid_amount);
    return sum;
  }, 0);

  const pendingQuotes = allQuotes.filter(
    (q) => q.payment_status === "Pendiente" || q.payment_status === "Parcial"
  );
  const totalPending = pendingQuotes.reduce((sum, q) => {
    if (q.payment_status === "Parcial" && q.paid_amount) {
      return sum + (Number(q.amount) - Number(q.paid_amount));
    }
    return sum + Number(q.amount);
  }, 0);

  const totalQuotes = allQuotes.length;

  const { data: pendingList } = await supabase
    .from("quotes")
    .select("id, amount, paid_amount, payment_status, concept, clients(name)")
    .eq("user_id", userId)
    .in("payment_status", ["Pendiente", "Parcial"])
    .order("created_at", { ascending: false });

  const cards = [
    {
      title: "Facturación total",
      value: formatCurrency(totalBilled),
      icon: TrendingUp,
    },
    {
      title: "Pendiente de cobro",
      value: formatCurrency(totalPending),
      icon: Receipt,
    },
    {
      title: "Total presupuestos",
      value: totalQuotes,
      icon: FileText,
    },
    {
      title: "Clientes",
      value: clientsCount,
      icon: Users,
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

      <PendingPayments
        quotes={(pendingList ?? []).map((q) => ({
          id: q.id,
          client_name: (q.clients as unknown as { name: string }[])?.[0]?.name ?? null,
          concept: q.concept,
          amount: Number(q.amount),
          paid_amount: q.paid_amount ? Number(q.paid_amount) : null,
          payment_status: q.payment_status as "Pendiente" | "Parcial" | "Pagado",
        }))}
      />
    </div>
  );
}
