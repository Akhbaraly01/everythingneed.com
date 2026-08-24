import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { Button } from "@shared/ui/button";
import { Users, TrendingUp, ShoppingCart, Store, Download, FileText } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { analyticsApi } from "../services";

const PIE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];
const TOOLTIP_STYLE = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px" };

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");

  const { data: overviewRes } = useQuery({
    queryKey: ["analytics", "overview", dateRange],
    queryFn: () => analyticsApi.overview(dateRange),
  });

  const { data: userGrowthRes } = useQuery({
    queryKey: ["analytics", "userGrowth", dateRange],
    queryFn: () => analyticsApi.userGrowth(dateRange),
  });

  const { data: revenueRes } = useQuery({
    queryKey: ["analytics", "revenue", dateRange],
    queryFn: () => analyticsApi.revenue(dateRange),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["analytics", "categories", dateRange],
    queryFn: () => analyticsApi.categories(dateRange),
  });

  const { data: trafficRes } = useQuery({
    queryKey: ["analytics", "traffic", dateRange],
    queryFn: () => analyticsApi.traffic(dateRange),
  });

  const overview = overviewRes?.data;
  const userGrowthData = userGrowthRes?.data ?? [];
  const revenueData = revenueRes?.data ?? [];
  const categoriesData = categoriesRes?.data ?? [];
  const trafficData = trafficRes?.data ?? [];

  return (
    <AdminLayout title="Analytics" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">Platform-wide metrics and growth insights</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 px-3 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-violet-500"
              aria-label="Select date range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Exporting CSV report...")}
              className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Generating PDF report...")}
              className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={(overview?.total_users ?? 0).toLocaleString()} icon={<Users className="w-4 h-4" />} color="primary" trend={{ value: 12, isPositive: true, label: "vs prev period" }} />
          <StatCard title="Revenue" value={`$${(overview?.total_revenue ?? 0).toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} color="success" trend={{ value: 24, isPositive: true, label: "vs prev period" }} />
          <StatCard title="Total Orders" value={(overview?.total_orders ?? 0).toLocaleString()} icon={<ShoppingCart className="w-4 h-4" />} color="info" trend={{ value: 8, isPositive: true, label: "vs prev period" }} />
          <StatCard title="Active Vendors" value={(overview?.active_vendors ?? 0).toLocaleString()} icon={<Store className="w-4 h-4" />} color="warning" trend={{ value: 5, isPositive: true, label: "vs prev period" }} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="value" name="Total Users" stroke="#8b5cf6" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue (Monthly)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Orders by Category</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoriesData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="label">
                    {categoriesData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, ""]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Traffic Sources</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trafficData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
