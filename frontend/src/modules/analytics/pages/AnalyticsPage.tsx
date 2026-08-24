import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, DollarSign, ShoppingCart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState({ total_users: 0, total_revenue: 0, total_orders: 0, active_vendors: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      http.get<{ data?: any }>(`${API}/admin/analytics/overview`),
      http.get<{ data?: any }>(`${API}/admin/analytics/user-growth?range=180d`),
    ]).then(([overviewRes, growthRes]) => {
      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value.data?.data || overview);
      if (growthRes.status === "fulfilled") {
        const data = growthRes.value.data?.data || [];
        setChartData(data.map((d: any) => ({ name: d.label, users: d.value })));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><BarChart3 className="h-8 w-8" /> Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Users", value: overview.total_users, icon: Users, color: "text-primary" },
          { title: "Revenue", value: `$${overview.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-success" },
          { title: "Orders", value: overview.total_orders, icon: ShoppingCart, color: "text-secondary" },
          { title: "Vendors", value: overview.active_vendors, icon: BarChart3, color: "text-warning" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{s.title}</p><p className="text-3xl font-bold">{s.value}</p></div><s.icon className={`h-8 w-8 ${s.color}`} /></div></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" /></AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
