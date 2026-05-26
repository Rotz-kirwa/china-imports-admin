import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CreditCard, DollarSign, ReceiptText, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { formatKsh } from "@/lib/utils";

type ProfitRow = {
  productName: string;
  quantitySold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
};

type MonthlyRow = {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
};

type RevenueTypeRow = {
  orderType: string;
  revenue: number;
};

export default function ReportsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: adminApi.reports,
  });

  const summary = data?.summary || {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    pendingPayments: 0,
    lowStockItems: 0,
  };
  const profitability = (data?.productProfitability as ProfitRow[]) || [];
  const monthly = (data?.monthlyPerformance as MonthlyRow[]) || [];
  const revenueByType = (data?.revenueByType as RevenueTypeRow[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Profit & Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Track revenue, landed cost exposure, gross profit, and payment pressure.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={formatKsh(summary.revenue)} change="Non-cancelled orders" changeType="positive" icon={DollarSign} />
        <StatCard title="Cost of Goods" value={formatKsh(summary.cogs)} change="Based on product cost price" changeType="neutral" icon={ReceiptText} />
        <StatCard title="Gross Profit" value={formatKsh(summary.grossProfit)} change="Revenue minus COGS" changeType="positive" icon={CreditCard} />
        <StatCard title="Pending Payments" value={formatKsh(summary.pendingPayments)} change={`${summary.lowStockItems} low stock items`} changeType="negative" icon={AlertTriangle} />
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading reports...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load reports right now.</CardContent>
        </Card>
      )}

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number) => formatKsh(value)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Revenue Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revenueByType.length ? (
              revenueByType.map((item) => (
                <div key={item.orderType} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize">{item.orderType}</p>
                    <span className="font-semibold">{formatKsh(item.revenue)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No revenue split available yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Top Profit Contributors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>COGS</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitability.length ? (
                profitability.map((row) => {
                  const margin = row.revenue > 0 ? ((row.grossProfit / row.revenue) * 100).toFixed(1) : "0.0";
                  const marginNum = Number(margin);
                  return (
                    <TableRow key={row.productName}>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell>{row.quantitySold}</TableCell>
                      <TableCell>{formatKsh(row.revenue)}</TableCell>
                      <TableCell>{formatKsh(row.cogs)}</TableCell>
                      <TableCell className="font-semibold">{formatKsh(row.grossProfit)}</TableCell>
                      <TableCell>
                        <span className={`font-bold text-sm ${marginNum >= 30 ? "text-success" : marginNum >= 15 ? "text-warning" : "text-destructive"}`}>
                          {margin}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No profitability data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overall margin summary */}
      {summary.revenue > 0 && (
        <Card>
          <CardContent className="py-4 px-6 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-muted-foreground">Overall Gross Margin</p>
              <p className={`text-2xl font-bold ${(summary.grossProfit / summary.revenue) * 100 >= 20 ? "text-success" : "text-warning"}`}>
                {((summary.grossProfit / summary.revenue) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">{formatKsh(summary.revenue)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Total COGS</p>
              <p className="text-lg font-semibold">{formatKsh(summary.cogs)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className="text-lg font-semibold text-success">{formatKsh(summary.grossProfit)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
