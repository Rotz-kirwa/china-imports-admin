import { Users, CreditCard, ShoppingCart, MessageCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Order = { id: string; userName: string; items: number; total: number; status: string };
type ChatMessage = { id: string; userName: string; avatar: string; lastMessage: string; time: string; unread: number; online: boolean };
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatKsh } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

type RevenuePoint = {
  month: string;
  revenue: number;
};

function buildRevenueSeries(data: RevenuePoint[]) {
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);

    const month = monthFormatter.format(date);
    const matchedPoint = data.find((item) => item.month === month);

    return {
      month,
      revenue: matchedPoint?.revenue ?? 0,
    };
  });
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.dashboard,
  });

  const stats = data?.stats || {
    users: 0,
    revenue: 0,
    orders: 0,
    activeChats: 0,
  };
  const chartRevenue = buildRevenueSeries((data?.revenueData as RevenuePoint[] | undefined) || []);
  const chartOrders = data?.orderData || [];
  const recentOrders = (data?.recentOrders as unknown as Order[]) || [];
  const recentChats = (data?.recentChats as unknown as ChatMessage[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your business metrics</p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading live operations metrics...</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">
            Unable to load dashboard metrics right now. Please sign in again or check the backend connection.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={String(stats.users)} change="Registered accounts" changeType="neutral" icon={Users} />
        <StatCard title="Confirmed Revenue" value={formatKsh(stats.revenue)} change="Completed payments" changeType="positive" icon={CreditCard} />
        <StatCard title="Total Orders" value={String(stats.orders)} change="All time" changeType="neutral" icon={ShoppingCart} />
        <StatCard title="Unread Chats" value={String(stats.activeChats)} change="Awaiting response" changeType={stats.activeChats > 0 ? "negative" : "neutral"} icon={MessageCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartRevenue} barCategoryGap="38%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number) => formatKsh(value)}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Orders This Week</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Recent Orders</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentOrders.length ? (
              <div className="divide-y">
                {recentOrders.slice(0, 4).map(order => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">{order.id} · {order.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatKsh(order.total)}</p>
                      <Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"} className="text-xs mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm text-muted-foreground">No orders have been recorded yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Recent Chats</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentChats.length ? (
              <div className="divide-y">
                {recentChats.slice(0, 4).map(chat => (
                  <div key={chat.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{chat.avatar}</div>
                      {chat.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{chat.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{chat.time}</p>
                      {chat.unread > 0 && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-1">{chat.unread}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm text-muted-foreground">No customer chats are active right now.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
