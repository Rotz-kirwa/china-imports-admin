import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatKsh } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, ADMIN_TOKEN_KEY, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Eye, MapPin, Package, User, Clock, CreditCard, ChevronRight } from "lucide-react";
import { ADMIN_TOKEN_KEY } from "@/lib/api";
import { Link } from "react-router-dom";

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
  paymentMethod?: string;
};

type OrderDetails = {
  order: {
    id: string;
    dbId: string;
    userName: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingAddress?: string;
    paymentMethod?: string;
    paymentStatus: string;
    total: number;
    status: string;
    date: string;
    notes?: string;
  };
  items: Array<{
    id: string;
    productName: string;
    imageUrl?: string;
    sku?: string;
    externalId?: string;
    quantity: number;
    unitPrice: number;
    isWholesale: boolean;
  }>;
  customerUser?: {
    id: string;
  };
  payments?: Array<{
    dbId: string;
    method: string;
    date?: string;
    id?: string;
    amount: number;
  }>;
  statusHistory?: Array<{
    id: string;
    status: string;
    date: string;
    notes?: string;
  }>;
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: adminApi.orders,
  });

  // Real-time order notifications via SSE
  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;
    const src = new EventSource(`${API_BASE}/admin/events?token=${encodeURIComponent(token)}`);

    function onOrderCreated(e: MessageEvent) {
      try {
        const payload = JSON.parse(e.data || "{}");
        if (payload && payload.orderNumber) {
          toast.success(`New order ${payload.orderNumber} — ${payload.customerName}`);
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }
      } catch (err) {
        // ignore parse errors
      }
    }

    src.addEventListener('order_created', onOrderCreated as EventListener);
    // fallback generic message
    src.addEventListener('message', onOrderCreated as EventListener);

    src.onerror = () => {
      // attempt automatic reconnection handled by browser, just log
      // console.warn('SSE connection error');
    };

    return () => {
      src.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["admin-order", selectedOrderId],
    queryFn: () => adminApi.order(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const [newStatus, setNewStatus] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminApi.updateOrderStatus(id, status, notes),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["admin-order", selectedOrderId] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setNewStatus("");
      setNewNotes("");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update order."),
  });

  const orderRows = (data?.orders as Order[]) || [];
  const details = detailsData as OrderDetails | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orderRows.length} total orders</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["Order Received", "Order Confirmed", "Processing", "Awaiting Payment", "Payment Confirmed", "Packaging", "Dispatched", "In Transit", "Out for Delivery", "Delivered", "Completed", "Cancelled", "Refunded"].map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              {orderRows.filter(o => statusFilter === "all" || o.status === statusFilter).length ? (
                orderRows.filter(o => statusFilter === "all" || o.status === statusFilter).map(o => (
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
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(o.date).toLocaleDateString()} {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </TableCell>
                     <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={() => setSelectedOrderId(o.dbId)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
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

      {/* Order Details Sheet */}
      <Sheet open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              Order Details
              {details?.order && (
                <Badge variant={details.order.status === "delivered" ? "default" : "secondary"} className="ml-2">
                  {details.order.status}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {details?.order ? `Order ID: ${details.order.id}` : "Loading order..."}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {isLoadingDetails ? (
              <div className="p-6 text-center text-muted-foreground">Loading details...</div>
            ) : details?.order ? (
              <div className="p-6 space-y-8">
                
                {/* Order Summary Header Info */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Order Date & Time</p>
                    <p className="font-semibold text-sm">
                      {new Date(details.order.date).toLocaleDateString()} {new Date(details.order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-sm text-gold">
                      {formatKsh(details.order.total)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <User className="h-4 w-4" /> Customer Information
                  </h3>
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium text-sm">{details.order.userName}</p>
                        {details.customerUser && (
                          <p className="text-xs text-muted-foreground">Registered account: <Link to={`/users/${details.customerUser.id}`} className="text-primary-700 hover:underline">View user</Link></p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">{details.order.customerEmail || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium text-sm">{details.order.customerPhone || "N/A"}</p>
                      </div>
                    </div>
                </div>

                {/* Shipping & Payment */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <MapPin className="h-4 w-4" /> Shipping Address
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <p className="text-sm whitespace-pre-wrap">{details.order.shippingAddress || "No address provided."}</p>
                      {details.order.shippingAddress && (
                        <>
                          <div className="mt-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.order.shippingAddress)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-700 hover:underline"
                            >
                              View on map
                            </a>
                          </div>

                          <div className="mt-3 rounded overflow-hidden border" style={{ height: 200 }}>
                            <iframe
                              title="shipping-location"
                              src={`https://www.google.com/maps?q=${encodeURIComponent(details.order.shippingAddress)}&output=embed`}
                              width="100%"
                              height="200"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <CreditCard className="h-4 w-4" /> Payment Details
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Method</span>
                        <span className="text-sm font-medium capitalize">{details.order.paymentMethod || "M-Pesa"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs text-muted-foreground">Status</span>
                          <div>
                            <Badge variant={details.order.paymentStatus === "completed" ? "default" : "secondary"} className="h-5 text-[10px]">
                              {details.order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>Total: <span className="font-medium text-sm text-gold">{formatKsh(details.order.total)}</span></div>
                        </div>
                      </div>

                      {/* Payments history */}
                      {details.payments && details.payments.length > 0 && (
                        <div className="pt-2 border-t border-border/20">
                          <div className="text-xs text-muted-foreground mb-1">Payments</div>
                          <div className="space-y-2">
                            {details.payments.map((p) => (
                              <div key={p.dbId} className="flex items-center justify-between text-sm">
                                <div className="truncate">
                                  <span className="font-medium">{p.method}</span>
                                  <span className="text-muted-foreground text-xs ml-2">{p.date ? new Date(p.date).toLocaleString() : ''}</span>
                                  {p.id && <span className="text-xs text-muted-foreground ml-2">ref: {p.id}</span>}
                                </div>
                                <div className="font-semibold">{formatKsh(p.amount)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <Package className="h-4 w-4" /> Order Items ({details.items.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-16">Image</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-cover rounded-md border" />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded-md border flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm leading-tight">{item.productName}</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {item.sku && <span className="mr-2">SKU: {item.sku}</span>}
                                {item.externalId && <span className="mr-2">ID: {item.externalId}</span>}
                              </div>
                              {item.isWholesale && <Badge variant="outline" className="mt-1 text-[10px]">Wholesale</Badge>}
                            </TableCell>
                            <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{formatKsh(item.unitPrice)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{formatKsh(item.unitPrice * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={4} className="text-right font-bold">Order Total</TableCell>
                          <TableCell className="text-right font-bold text-gold">{formatKsh(details.order.total)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Notes */}
                {details.order.notes && (
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <Clock className="h-4 w-4" /> Order Notes
                    </h3>
                    <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 text-sm text-amber-900">
                      {details.order.notes}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Status Timeline */}
                {details.statusHistory && details.statusHistory.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status Timeline</h3>
                    <div className="space-y-4 border-l-2 border-primary/20 ml-2 pl-4">
                      {details.statusHistory.map((h) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white" />
                          <div className="text-sm font-semibold">{h.status}</div>
                          <div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString()}</div>
                          {h.notes && <div className="mt-1 text-sm bg-muted/50 p-2 rounded">{h.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Update Status Form */}
                <div className="space-y-4 pb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Order Status</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs mb-1 block">New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["Order Received", "Order Confirmed", "Processing", "Awaiting Payment", "Payment Confirmed", "Packaging", "Dispatched", "In Transit", "Out for Delivery", "Delivered", "Completed", "Cancelled", "Refunded"].map((st) => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Notes (Optional)</Label>
                      <Textarea 
                        placeholder="Add details about this status change..." 
                        value={newNotes} 
                        onChange={(e) => setNewNotes(e.target.value)} 
                        className="resize-none"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={!newStatus || updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: details.order.dbId, status: newStatus, notes: newNotes })}
                    >
                      {updateMutation.isPending ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">Order details could not be loaded.</div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
