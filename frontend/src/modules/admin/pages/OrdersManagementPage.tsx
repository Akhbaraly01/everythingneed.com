import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@shared/ui/button";
import { ShoppingCart, Clock, CheckCircle, XCircle, DollarSign, MoreHorizontal, RefreshCw, ReceiptText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { ordersApi } from "../services";

const STATUS_OPTIONS = ["all", "pending", "in_progress", "completed", "cancelled"];

export default function OrdersManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<{ id: string; order_number: string; total: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; order_number: string } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, search, statusFilter],
    queryFn: () => ordersApi.list({ search, status: statusFilter, page }),
  });

  const orders = data?.data ?? [];
  const pending = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.updateStatus(id, "cancelled"),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Failed to cancel order"),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => ordersApi.refund(id),
    onSuccess: () => {
      toast.success("Refund issued successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Failed to issue refund"),
  });

  const columns: ColumnDef<any>[] = [
    {
      key: "id",
      header: "Order #",
      render: (row) => <span className="text-xs font-mono font-medium text-violet-400">#{row.id.slice(-8).toUpperCase()}</span>,
    },
    {
      key: "total",
      header: "Total",
      render: (row) => <span className="text-sm font-semibold text-emerald-400">${Number(row.total).toFixed(2)}</span>,
    },
    {
      key: "items_count",
      header: "Items",
      align: "center",
      render: (row) => <span className="text-sm text-slate-300">{row.items_count ?? "—"}</span>,
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 text-xs">
              <ReceiptText className="w-3.5 h-3.5 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status !== "cancelled" && (
              <DropdownMenuItem
                onClick={() => setCancelTarget({ id: row.id, order_number: row.id.slice(-8).toUpperCase() })}
                className="text-orange-400 focus:bg-slate-700 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Order
              </DropdownMenuItem>
            )}
            {row.status === "completed" && (
              <>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setRefundTarget({ id: row.id, order_number: row.id.slice(-8).toUpperCase(), total: `$${Number(row.total).toFixed(2)}` })}
                  className="text-red-400 focus:bg-red-900/20 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> Issue Refund
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout title="Orders" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Orders" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Orders Management</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor and manage all marketplace orders</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Orders" value={data?.total ?? 0} icon={<ShoppingCart className="w-4 h-4" />} color="primary" />
          <StatCard title="Pending" value={pending} icon={<Clock className="w-4 h-4" />} color="warning" />
          <StatCard title="Completed" value={completed} icon={<CheckCircle className="w-4 h-4" />} color="success" />
          <StatCard title="Cancelled" value={cancelled} icon={<XCircle className="w-4 h-4" />} color="danger" />
          <StatCard title="Total Revenue" value="$1,232.79" icon={<DollarSign className="w-4 h-4" />} color="info" />
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            searchValue={search}
            onSearchChange={setSearch}
            filterSlot={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-violet-500"
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All Status" : s.replace(/_/g, " ")}</option>
                ))}
              </select>
            }
            exportOptions={{ onExportCsv: () => toast.success("Exporting orders CSV...") }}
            pagination={{ page, perPage: 20, total: data?.total ?? 0, onPageChange: setPage }}
          />
        </div>
      </div>

      <ConfirmDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
        title="Cancel Order" description={`Cancel order ${cancelTarget?.order_number}? The customer will be notified.`}
        onConfirm={async () => {
          if (!cancelTarget) return;
          await cancelMutation.mutateAsync(cancelTarget.id);
          setCancelTarget(null);
        }} confirmLabel="Cancel Order" variant="destructive" />

      <ConfirmDialog open={!!refundTarget} onOpenChange={(v) => !v && setRefundTarget(null)}
        title="Issue Refund" description={`Issue a full refund of ${refundTarget?.total} for order ${refundTarget?.order_number}?`}
        onConfirm={async () => {
          if (!refundTarget) return;
          await refundMutation.mutateAsync(refundTarget.id);
          setRefundTarget(null);
        }} confirmLabel="Issue Refund" variant="destructive" />
    </AdminLayout>
  );
}
