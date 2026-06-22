import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { formatKsh } from "@/lib/utils";
import { Package, AlertTriangle, XCircle, TrendingUp, History, Database } from "lucide-react";
export default function InventoryPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-inventory-stats"],
    queryFn: adminApi.getInventoryStats,
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-inventory-logs"],
    queryFn: adminApi.getInventoryLogs,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: adminApi.getProducts,
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: { productId: string; changeQuantity: number; reason: string }) =>
      adminApi.adjustInventory(payload),
    onSuccess: (data) => {
      toast.success(`Stock adjusted successfully. New quantity: ${data.newQuantity}`);
      setAdjustModalOpen(false);
      setAdjustQty("");
      setAdjustReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to adjust stock.");
    },
  });

  const handleAdjustClick = (product: any) => {
    setSelectedProduct(product);
    setAdjustModalOpen(true);
  };

  const submitAdjustment = () => {
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty)) {
      toast.error("Please enter a valid number.");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please provide a reason for the adjustment.");
      return;
    }
    adjustMutation.mutate({
      productId: selectedProduct.id,
      changeQuantity: qty,
      reason: adjustReason,
    });
  };

  const stats = statsData?.stats as any;
  const logs = logsData?.logs as any[] || [];
  const products = productsData?.products as any[] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Inventory Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="flex gap-2"><TrendingUp className="w-4 h-4"/> Dashboard</TabsTrigger>
          <TabsTrigger value="operations" className="flex gap-2"><Database className="w-4 h-4"/> Stock Operations</TabsTrigger>
          <TabsTrigger value="logs" className="flex gap-2"><History className="w-4 h-4"/> Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
                <p className="text-xs text-muted-foreground">Catalog items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatKsh(Number(stats?.total_stock_value || 0))}</div>
                <p className="text-xs text-muted-foreground">Based on cost price</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-600">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats?.low_stock || 0}</div>
                <p className="text-xs text-muted-foreground">Items at or below threshold</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-destructive">Out of Stock</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats?.out_of_stock || 0}</div>
                <p className="text-xs text-muted-foreground">Items requiring immediate reorder</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attention Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.filter(p => p.stockQuantity <= p.lowStockThreshold).slice(0, 10).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell className="font-bold">{p.stockQuantity}</TableCell>
                      <TableCell>
                        {p.stockQuantity <= 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">Low Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleAdjustClick(p)}>Adjust</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.filter(p => p.stockQuantity <= p.lowStockThreshold).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        All products have healthy stock levels.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Stock List</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="text-center py-4 text-muted-foreground">Loading products...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>{p.sku}</TableCell>
                        <TableCell className="font-bold">{p.stockQuantity}</TableCell>
                        <TableCell>{p.lowStockThreshold}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleAdjustClick(p)}>Adjust</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="text-center py-4 text-muted-foreground">Loading logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Action / Reason</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>New Qty</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.product_name}
                          <div className="text-xs text-muted-foreground">{log.sku}</div>
                        </TableCell>
                        <TableCell>{log.reason}</TableCell>
                        <TableCell>
                          <Badge variant={log.change_quantity > 0 ? "default" : "destructive"}>
                            {log.change_quantity > 0 ? "+" : ""}{log.change_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{log.new_quantity}</TableCell>
                        <TableCell className="text-sm">{log.actor_name}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          No inventory logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md">
              <div>
                <Label className="text-xs text-muted-foreground">Current Stock</Label>
                <div className="text-lg font-bold">{selectedProduct?.stockQuantity}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Projected Stock</Label>
                <div className="text-lg font-bold text-primary">
                  {Math.max(0, (selectedProduct?.stockQuantity || 0) + (parseInt(adjustQty, 10) || 0))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity Change (+/-)</Label>
              <Input 
                type="number" 
                placeholder="e.g. 10 or -5" 
                value={adjustQty} 
                onChange={(e) => setAdjustQty(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use negative numbers to reduce stock, positive to add stock.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Reason for Adjustment</Label>
              <Input 
                placeholder="e.g. Received new shipment, Damaged item" 
                value={adjustReason} 
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
            <Button onClick={submitAdjustment} disabled={adjustMutation.isPending || !adjustQty || !adjustReason.trim()}>
              {adjustMutation.isPending ? "Applying..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
