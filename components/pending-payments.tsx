"use client";

import { updatePaymentStatus } from "@/lib/quotes/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PendingQuote = {
  id: string;
  client_name: string | null;
  concept: string;
  amount: number;
  paid_amount: number | null;
  payment_status: "Pendiente" | "Parcial" | "Pagado";
};

export function PendingPayments({ quotes }: { quotes: PendingQuote[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pendientes de cobro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay cobros pendientes
          </p>
        ) : (
          quotes.map((q) => <SwipeablePaymentItem key={q.id} quote={q} />)
        )}
      </CardContent>
    </Card>
  );
}

function SwipeablePaymentItem({ quote }: { quote: PendingQuote }) {
  const remaining =
    quote.payment_status === "Parcial" && quote.paid_amount
      ? Math.max(0, Number(quote.amount) - Number(quote.paid_amount))
      : Number(quote.amount);

  return (
    <div className="group relative overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between p-3 bg-background transition-transform duration-200 group-hover:-translate-x-20">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{quote.client_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{quote.concept}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-sm font-semibold">{formatCurrency(remaining)}</p>
          <Badge variant={quote.payment_status === "Parcial" ? "secondary" : "outline"}>
            {quote.payment_status === "Parcial"
              ? `Parcial (${formatCurrency(Number(quote.paid_amount))})`
              : "Pendiente"}
          </Badge>
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="flex items-center justify-center gap-1 w-full h-full cursor-pointer"
          onClick={() => {
            const formData = new FormData();
            formData.append("id", quote.id);
            formData.append("payment_status", "Pagado");
            updatePaymentStatus(formData);
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Cobrado
        </button>
      </div>
    </div>
  );
}
