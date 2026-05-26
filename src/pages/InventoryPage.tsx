import { useState } from "react";
import { Boxes, AlertTriangle, PackageX, Wallet, Pencil, Check, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { adminApi } from "@/lib/api";
import { formatKsh } from "@/lib/utils";
import { toast } from "sonner";

type InventoryItem = {
  id: string;
  dbId: string;
  name: string;
  category: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  damagedQuantity: number;
  warehouseLocation: string;
  stockValue: number;
  lowStock: boolean;
  localAvailable: boolean;
  offshoreAvailable: boolean;
};

type Movement = {
  id: string;
  productName: string;
  previousQuantity: number;
  changeQuantity: number;
  newQuantity: number;
  reason: string;
  actorName: string;
  createdAt: string;
};

type EditState = { qty: string; reason: string };

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, EditState>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: adminApi.inventory,
  });

  const updateStock = useMutation({
    mutationFn: ({ id, stockQuantity, reason }: { id: string; stockQuantity: number; reason: string }) =>
      adminApi.updateInventory(id, stockQuantity, reason),
    onSuccess: (_, { id }) => {
      toast.success("Stock updated successfully.");
      setEditing((prev) => { const next = { ...prev }; delete next[id]; return next; });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
    onError: () => toast.error("Failed to update stock."),
  });

  const summary = data?.summary || { totalUnits: 0, lowStockItems: 0, inventoryValue: 0, damagedUnits: 0 };
  const items = (data?.items as unknown as InventoryItem[]) || [];
  const movements = (data?.movements as unknown as Movement[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor and update stock levels, valuation, and movement history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Units On Hand" value={String(summary.totalUnits)} change="Current stock count" changeType="neutral" icon={Boxes} />
        <StatCard title="Low Stock Alerts" value={String(summary.lowStockItems)} change="Products at or below threshold" changeType="negative" icon={AlertTriangle} />
        <StatCard title="Inventory Value" value={formatKsh(summary.inventoryValue)} change="Based on cost price" changeType="positive" icon={Wallet} />
        <StatCard title="Damaged Units" value={String(summary.damagedUnits)} change="Quarantined from sale" changeType="negative" icon={PackageX} />
      </div>

      {isLoading && <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading inventory...</CardContent></Card>}
      {error && <Card className="border-destructive/30"><CardContent className="py-6 text-sm text-destructive">Unable to load inventory right now.</CardContent></Card>}

      <div className="grid xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Stock Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length ? (
                  items.map((item) => {
                    const itemId = item.dbId || item.id;
                    const isEditingThis = Boolean(editing[itemId]);
                    return (
                      <TableRow key={itemId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{item.stockQuantity}</p>
                            <p className="text-xs text-muted-foreground">Min {item.lowStockThreshold}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item.warehouseLocation}</TableCell>
                        <TableCell className="font-semibold">{formatKsh(item.stockValue)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={item.lowStock ? "destructive" : "default"}>{item.lowStock ? "Low" : "OK"}</Badge>
                            {item.localAvailable && <Badge variant="secondary">Retail</Badge>}
                            {item.offshoreAvailable && <Badge variant="secondary">Wholesale</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditingThis ? (
                            <div className="space-y-1.5 min-w-[180px]">
                              <Input
                                type="number"
                                min={0}
                                placeholder="New qty"
                                className="h-7 text-xs"
                                value={editing[itemId].qty}
                                onChange={(e) => setEditing((prev) => ({ ...prev, [itemId]: { ...prev[itemId], qty: e.target.value } }))}
                              />
                              <Input
                                placeholder="Reason"
                                className="h-7 text-xs"
                                value={editing[itemId].reason}
                                onChange={(e) => setEditing((prev) => ({ ...prev, [itemId]: { ...prev[itemId], reason: e.target.value } }))}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-success text-white hover:bg-success/90 flex-1"
                                  disabled={
                                    updateStock.isPending ||
                                    !editing[itemId].reason.trim() ||
                                    editing[itemId].qty === ""
                                  }
                                  onClick={() =>
                                    updateStock.mutate({
                                      id: itemId,
                                      stockQuantity: Number(editing[itemId].qty),
                                      reason: editing[itemId].reason,
                                    })
                                  }
                                >
                                  <Check className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setEditing((prev) => { const next = { ...prev }; delete next[itemId]; return next; })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditing((prev) => ({ ...prev, [itemId]: { qty: String(item.stockQuantity), reason: "" } }))}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No inventory records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.length ? (
              movements.map((movement) => (
                <div key={movement.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm">{movement.productName}</p>
                    <span className={`text-xs font-semibold ${movement.changeQuantity < 0 ? "text-destructive" : "text-success"}`}>
                      {movement.changeQuantity > 0 ? "+" : ""}{movement.changeQuantity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {movement.previousQuantity} → {movement.newQuantity} · {movement.reason}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {movement.actorName} · {new Date(movement.createdAt).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No stock movements recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
