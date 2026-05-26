import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKsh } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type Order = {
  id: string;
  dbId: string;
  userName: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
  orderType: string;
  date: string;
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: adminApi.orders,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "shipped" | "delivered" | "cancelled" }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update order."),
  });

  const orderRows = (data?.orders as Order[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{orderRows.length} total orders</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading orders...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load orders right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderRows.length ? (
                orderRows.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="font-medium">{o.userName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{o.orderType || "retail"}</Badge>
                    </TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell className="font-semibold">{formatKsh(o.total)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.paymentStatus === "completed" ? "default" : o.paymentStatus === "pending" ? "secondary" : "destructive"}>
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{String(o.date).slice(0, 10)}</TableCell>
                    <TableCell>
                      {o.status === "processing" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={o.paymentStatus !== "completed" || updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: o.dbId, status: "shipped" })}
                          >
                            Mark Shipped
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: o.dbId, status: "cancelled" })}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {o.status === "shipped" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: o.dbId, status: "delivered" })}
                        >
                          Mark Delivered
                        </Button>
                      )}
                      {(o.status === "delivered" || o.status === "cancelled") && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No orders found.
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
