import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { ScrollText, Shield, Calendar, Activity, Download } from "lucide-react";
import { auditLogsApi } from "../services";

type AuditLog = {
  id: string; timestamp: string; user: string; action: string;
  entity_type: string; entity_id: string; details: string;
};

const ACTION_STYLES: Record<string, { label: string; classes: string }> = {
  create: { label: "CREATE", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  update: { label: "UPDATE", classes: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  delete: { label: "DELETE", classes: "bg-red-500/15 text-red-400 border-red-500/25" },
  auth:   { label: "AUTH",   classes: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  export: { label: "EXPORT", classes: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  view:   { label: "VIEW",   classes: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: logsRes } = useQuery({
    queryKey: ["audit-logs", search, actionFilter, page],
    queryFn: () => auditLogsApi.list({ search: search || undefined, action: actionFilter, page, limit: 20 }),
  });

  const { data: statsRes } = useQuery({
    queryKey: ["audit-logs", "stats"],
    queryFn: () => auditLogsApi.stats(),
  });

  const logs: AuditLog[] = (logsRes?.data ?? []).map((l) => ({
    id: l.id,
    timestamp: l.created_at,
    user: l.performed_by,
    action: l.action,
    entity_type: l.entity_type,
    entity_id: l.entity_id,
    details: l.details ?? "",
  }));

  const total = logsRes?.total ?? logs.length;
  const todayCount = statsRes?.data?.today ?? 0;
  const criticalCount = logs.filter((l) => l.action === "delete" || l.action === "auth").length;

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      width: "160px",
      render: (row) => (
        <div>
          <p className="text-xs font-mono text-slate-300">{row.timestamp.split(" ")[1]}</p>
          <p className="text-[10px] text-slate-500">{row.timestamp.split(" ")[0]}</p>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (row) => <span className="text-xs text-violet-400">{row.user}</span>,
    },
    {
      key: "action",
      header: "Action",
      width: "100px",
      render: (row) => {
        const style = ACTION_STYLES[row.action] ?? ACTION_STYLES.view;
        return (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${style.classes}`}>
            {style.label}
          </span>
        );
      },
    },
    {
      key: "entity_type",
      header: "Entity",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 px-1.5">{row.entity_type}</Badge>
          <span className="text-[10px] font-mono text-slate-500">{row.entity_id}</span>
        </div>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (row) => <span className="text-xs text-slate-400 truncate max-w-[260px] block">{row.details}</span>,
    },
  ];

  return (
    <AdminLayout title="Audit Logs" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Audit Logs" }]}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
            <p className="text-sm text-slate-400 mt-1">Complete audit trail of all admin actions and events</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Exporting audit logs...")}
            className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Events" value={total} icon={<ScrollText className="w-4 h-4" />} color="primary" />
          <StatCard title="Today" value={todayCount} icon={<Calendar className="w-4 h-4" />} color="info" />
          <StatCard title="This Week" value={total} icon={<Activity className="w-4 h-4" />} color="success" />
          <StatCard title="Critical Actions" value={criticalCount} icon={<Shield className="w-4 h-4" />} color="danger" />
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
          <DataTable
            columns={columns}
            data={logs}
            searchValue={search}
            onSearchChange={setSearch}
            filterSlot={
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-violet-500"
                aria-label="Filter by action type"
              >
                <option value="all">All Actions</option>
                {Object.keys(ACTION_STYLES).map((a) => (
                  <option key={a} value={a}>{a.toUpperCase()}</option>
                ))}
              </select>
            }
            pagination={{ page, perPage: 20, total, onPageChange: setPage }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
