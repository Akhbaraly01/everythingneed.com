import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { DollarSign, TrendingUp, ArrowDownCircle, Wallet } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { financeApi } from "../services";

const TOOLTIP_STYLE = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px" };

export default function FinanceAdminPage() {
  const [txSearch, setTxSearch] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);

  const { data: summaryRes } = useQuery({
    queryKey: ["finance", "summary"],
    queryFn: () => financeApi.summary(),
  });

  const { data: txRes } = useQuery({
    queryKey: ["finance", "transactions", txPage],
    queryFn: () => financeApi.transactions({ page: txPage }),
  });

  const { data: wdRes } = useQuery({
    queryKey: ["finance", "withdrawals", wdPage],
    queryFn: () => financeApi.withdrawals({ page: wdPage }),
  });

  const summary = summaryRes?.data;
  const transactions = txRes?.data ?? [];
  const withdrawals = wdRes?.data ?? [];

  const revenueData = transactions.length > 0
    ? transactions.reduce((acc: Record<string, { month: string; revenue: number; commission: number }>, tx) => {
        const month = new Date(tx.created_at).toLocaleString("default", { month: "short" });
        if (!acc[month]) acc[month] = { month, revenue: 0, commission: 0 };
        if (tx.type === "payment") acc[month].revenue += tx.amount;
        if (tx.type === "commission") acc[month].commission += tx.amount;
        return acc;
      }, {})
    : {};

  const chartData = Object.values(revenueData);

  const txData = transactions.map((tx) => ({
    id: tx.id,
    ref: `TXN-${tx.id.slice(0, 6).toUpperCase()}`,
    type: tx.type,
    user: tx.user_id,
    amount: tx.amount >= 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`,
    status: tx.status,
    date: tx.created_at,
  }));

  const wdData = withdrawals.map((wd) => ({
    id: wd.id,
    vendor: wd.vendor_id,
    amount: `$${wd.amount.toFixed(2)}`,
    method: "Bank Transfer",
    status: wd.status,
    requested: wd.requested_at,
  }));

  const txColumns: ColumnDef<typeof txData[0]>[] = [
    { key: "ref", header: "Reference", render: (r) => <span className="text-xs font-mono text-violet-400">{r.ref}</span> },
    { key: "type", header: "Type", render: (r) => <StatusBadge status={r.type} size="sm" /> },
    { key: "user", header: "User / Vendor", render: (r) => <span className="text-sm text-slate-200">{r.user}</span> },
    { key: "amount", header: "Amount", render: (r) => <span className={`text-sm font-bold ${r.amount.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{r.amount}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date", render: (r) => <span className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</span> },
  ];

  const wdColumns: ColumnDef<typeof wdData[0]>[] = [
    { key: "vendor", header: "Vendor", render: (r) => <span className="text-sm text-slate-200">{r.vendor}</span> },
    { key: "amount", header: "Amount", render: (r) => <span className="text-sm font-bold text-slate-200">{r.amount}</span> },
    { key: "method", header: "Method", render: (r) => <span className="text-xs text-slate-400">{r.method}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "requested", header: "Requested", render: (r) => <span className="text-xs text-slate-400">{new Date(r.requested).toLocaleDateString()}</span> },
  ];

  return (
    <AdminLayout title="Finance" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Finance" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Finance Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor revenue, commissions, transactions and withdrawals</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={`$${(summary?.total_revenue ?? 0).toLocaleString()}`} icon={<DollarSign className="w-4 h-4" />} color="success" trend={{ value: 14, isPositive: true, label: "vs last month" }} />
          <StatCard title="Platform Commission" value={`$${(summary?.total_commissions ?? 0).toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} color="primary" trend={{ value: 14, isPositive: true, label: "10% rate" }} />
          <StatCard title="Pending Withdrawals" value={`$${(summary?.pending_payouts ?? 0).toLocaleString()}`} icon={<ArrowDownCircle className="w-4 h-4" />} color="warning" />
          <StatCard title="Wallet Balance" value={`$${(summary?.active_subscriptions ?? 0).toLocaleString()}`} icon={<Wallet className="w-4 h-4" />} color="info" />
        </div>

        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            <TabsTrigger value="chart" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Revenue Chart</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue vs Commission (6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="comGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" fill="url(#revGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="commission" name="Commission" stroke="#10b981" fill="url(#comGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
              <DataTable
                columns={txColumns}
                data={txData}
                searchValue={txSearch}
                onSearchChange={setTxSearch}
                exportOptions={{ onExportCsv: () => toast.success("Exporting transactions...") }}
              />
            </div>
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
              <DataTable columns={wdColumns} data={wdData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
