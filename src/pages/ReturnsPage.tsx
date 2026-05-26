import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type ReturnItem = {
  id: string;
  orderNumber?: string | null;
  productName?: string | null;
  customerName?: string | null;
  reason: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
};

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: adminApi.returns,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: "approved" | "rejected" | "resolved"; resolution: string }) =>
      adminApi.updateReturn(id, status, resolution),
    onSuccess: (_, { status }) => {
      toast.success(`Return marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
    onError: () => toast.error("Failed to update return."),
  });

  const returns = (data?.returns as unknown as ReturnItem[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Returns</h1>
        <p className="text-muted-foreground text-sm mt-1">Review, approve, or reject customer return requests with a resolution note.</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading return requests...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load return requests right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="min-w-[260px]">Resolution & Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length ? (
                returns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.customerName || "Customer"}</TableCell>
                    <TableCell className="font-mono text-xs">{item.orderNumber || "N/A"}</TableCell>
                    <TableCell>{item.productName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">{item.reason}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell>
                      {item.status === "pending" ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Resolution note (required)"
                            className="h-7 text-xs"
                            value={resolutions[item.id] || ""}
                            onChange={(e) => setResolutions((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-success text-white hover:bg-success/90 h-7 px-2 text-xs flex-1"
                              disabled={updateMutation.isPending || !resolutions[item.id]?.trim()}
                              onClick={() => updateMutation.mutate({ id: item.id, status: "approved", resolution: resolutions[item.id] })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs flex-1"
                              disabled={updateMutation.isPending || !resolutions[item.id]?.trim()}
                              onClick={() => updateMutation.mutate({ id: item.id, status: "rejected", resolution: resolutions[item.id] })}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{item.resolution || "—"}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No returns found.
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
