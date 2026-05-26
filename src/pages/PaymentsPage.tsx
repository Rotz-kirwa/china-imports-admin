import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKsh } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { CreditCard, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: adminApi.payments,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "failed" }) =>
      adminApi.confirmPayment(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Payment marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: () => toast.error("Failed to update payment."),
  });

type Payment = {
  id: string;
  dbId: string;
  userId: string;
  userName: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  orderNumber?: string;
};

  const paymentRows = (data?.payments as unknown as Payment[]) || [];
  const totals = paymentRows.reduce(
    (acc, item) => {
      acc.total += Number(item.amount || 0);
      if (item.status === "completed") acc.completed += Number(item.amount || 0);
      if (item.status === "pending") acc.pending += Number(item.amount || 0);
      if (item.status === "failed") acc.failed += Number(item.amount || 0);
      return acc;
    },
    { total: 0, completed: 0, pending: 0, failed: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">{paymentRows.length} payment records</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Logged" value={formatKsh(totals.total)} change="All payment records" changeType="neutral" icon={CreditCard} />
        <StatCard title="Confirmed" value={formatKsh(totals.completed)} change="Verified successfully" changeType="positive" icon={CheckCircle2} />
        <StatCard title="Pending" value={formatKsh(totals.pending)} change="Needs review" changeType="negative" icon={AlertTriangle} />
        <StatCard title="Rejected" value={formatKsh(totals.failed)} change="Failed or declined" changeType="negative" icon={XCircle} />
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading payment records...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load payments right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRows.length ? (
                paymentRows.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.userName}</TableCell>
                    <TableCell className="font-semibold">{formatKsh(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.method}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.orderNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{String(p.date).slice(0, 10)}</TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-white hover:bg-success/90 h-7 px-2 text-xs"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate({ id: String(p.dbId), status: "completed" })}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate({ id: String(p.dbId), status: "failed" })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {p.status !== "pending" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No payment records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
