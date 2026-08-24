import { useQuery } from "@tanstack/react-query";
import { http } from "@core/api";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

interface HealthCheck {
  status?: string;
  checks?: Record<string, unknown>;
}

interface SystemStats {
  data?: {
    database_size?: string;
    uptime?: string;
    php_version?: string;
    laravel_version?: string;
    queue?: string;
    cache?: string;
    total_users?: number;
    total_vendors?: number;
    total_orders?: number;
  };
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> OK</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /> Down</span>
  );
}

export default function SystemHealthPage() {
  const healthRes = useQuery({
    queryKey: ["system", "health"],
    queryFn: () => http.get<HealthCheck>(`${API}/health`),
    refetchInterval: 30_000,
  });

  const statsRes = useQuery({
    queryKey: ["system", "stats"],
    queryFn: () => http.get<SystemStats>(`${API}/admin/stats/system`),
  });

  const checks = healthRes.data?.checks ?? {};
  const stats = statsRes.data?.data ?? {};

  const dbStatus = String(checks.database ?? "");

  return (
    <AdminLayout title="System Health">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-emerald-500" /> Live status
              <Badge variant={healthRes.data?.status === "operational" ? "default" : "destructive"} className="ml-auto">
                {healthRes.data?.status ?? "checking…"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {healthRes.isLoading && (
              <div className="space-y-2">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            )}
            {!healthRes.isLoading && (
              <>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Database (PostgreSQL)</span><StatusDot ok={dbStatus === "connected"} /></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Environment</span><span className="text-sm font-medium">{String(checks.environment ?? "—")}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">PHP</span><span className="text-sm font-medium">{String(checks.php ?? "—")}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Laravel</span><span className="text-sm font-medium">{String(checks.laravel ?? "—")}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Cache driver</span><span className="text-sm font-medium">{String(checks.cache ?? "—")}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Queue driver</span><span className="text-sm font-medium">{String(checks.queue ?? "—")}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm">Last check</span><span className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</span></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {statsRes.isLoading && (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            )}
            {!statsRes.isLoading && (
              <>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Users</span><span className="text-sm font-semibold">{stats.total_users ?? "—"}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Vendors</span><span className="text-sm font-semibold">{stats.total_vendors ?? "—"}</span></div>
                <div className="flex items-center justify-between border-b pb-2"><span className="text-sm">Orders</span><span className="text-sm font-semibold">{stats.total_orders ?? "—"}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm">Database size</span><span className="text-sm font-semibold">{stats.database_size ?? "—"}</span></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
