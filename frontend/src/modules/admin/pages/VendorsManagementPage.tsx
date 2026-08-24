import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Store, CheckCircle, Clock, XCircle, MoreHorizontal, Star, Check, X, Ban, RefreshCw } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { vendorsApi } from "../services";

export default function VendorsManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string; is_active: boolean } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors", page, search, statusFilter],
    queryFn: () => vendorsApi.list({ search, status: statusFilter, page }),
  });

  const vendors = data?.data ?? [];
  const verified = vendors.filter((v) => v.is_verified).length;
  const pending = vendors.filter((v) => !v.is_verified).length;
  const suspended = vendors.filter((v) => v.is_suspended).length;

  const approveMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.approve(id),
    onSuccess: () => {
      toast.success("Vendor approved");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to approve vendor"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.reject(id),
    onSuccess: () => {
      toast.warning("Vendor rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to reject vendor"),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.suspend(id),
    onSuccess: () => {
      toast.success("Vendor suspended");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to suspend vendor"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.restore(id),
    onSuccess: () => {
      toast.success("Vendor restored");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to restore vendor"),
  });

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Vendor",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.store_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{row.store_name}</p>
            <p className="text-xs text-slate-500">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{row.category}</Badge>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => (
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <span className="text-xs font-medium">{row.rating}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        if (row.is_suspended) return <StatusBadge status="suspended" />;
        if (!row.is_verified) return <StatusBadge status="pending" />;
        return <StatusBadge status="verified" />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" aria-label="Vendor actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
            {!row.is_verified && (
              <>
                <DropdownMenuItem onClick={() => setApproveTarget(row)} className="text-emerald-400 focus:bg-slate-700 text-xs">
                  <Check className="w-3.5 h-3.5 mr-2" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRejectTarget(row)} className="text-red-400 focus:bg-slate-700 text-xs">
                  <X className="w-3.5 h-3.5 mr-2" /> Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
              </>
            )}
            <DropdownMenuItem
              onClick={() => setSuspendTarget({ id: row.id, name: row.store_name, is_active: !row.is_suspended })}
              className="text-slate-300 focus:bg-slate-700 text-xs"
            >
              {!row.is_suspended
                ? <><Ban className="w-3.5 h-3.5 mr-2" /> Suspend</>
                : <><RefreshCw className="w-3.5 h-3.5 mr-2" /> Restore</>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout title="Vendors" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Vendors" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vendors Management</h1>
          <p className="text-sm text-slate-400 mt-1">Review, approve, and manage marketplace vendors</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Vendors" value={data?.total ?? 0} icon={<Store className="w-4 h-4" />} color="primary" />
          <StatCard title="Verified" value={verified} icon={<CheckCircle className="w-4 h-4" />} color="success" />
          <StatCard title="Pending Approval" value={pending} icon={<Clock className="w-4 h-4" />} color="warning" />
          <StatCard title="Suspended" value={suspended} icon={<XCircle className="w-4 h-4" />} color="danger" />
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
          <DataTable
            columns={columns}
            data={vendors}
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
              </select>
            }
            exportOptions={{ onExportCsv: () => toast.success("Exporting CSV...") }}
            pagination={{ page, perPage: 20, total: data?.total ?? 0, onPageChange: setPage }}
          />
        </div>
      </div>

      <ConfirmDialog open={!!approveTarget} onOpenChange={(v) => !v && setApproveTarget(null)}
        title="Approve Vendor" description={`Approve ${approveTarget?.name} as a verified vendor?`}
        onConfirm={async () => {
          if (!approveTarget) return;
          await approveMutation.mutateAsync(approveTarget.id);
          setApproveTarget(null);
        }} confirmLabel="Approve" />

      <ConfirmDialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}
        title="Reject Vendor" description={`Reject ${rejectTarget?.name}'s vendor application?`}
        onConfirm={async () => {
          if (!rejectTarget) return;
          await rejectMutation.mutateAsync(rejectTarget.id);
          setRejectTarget(null);
        }} confirmLabel="Reject" variant="destructive" />

      <ConfirmDialog open={!!suspendTarget} onOpenChange={(v) => !v && setSuspendTarget(null)}
        title={suspendTarget?.is_active ? "Suspend Vendor" : "Restore Vendor"}
        description={`${suspendTarget?.is_active ? "Suspend" : "Restore"} ${suspendTarget?.name}?`}
        onConfirm={async () => {
          if (!suspendTarget) return;
          if (suspendTarget.is_active) {
            await suspendMutation.mutateAsync(suspendTarget.id);
          } else {
            await restoreMutation.mutateAsync(suspendTarget.id);
          }
          setSuspendTarget(null);
        }}
        confirmLabel={suspendTarget?.is_active ? "Suspend" : "Restore"}
        variant={suspendTarget?.is_active ? "destructive" : "default"} />
    </AdminLayout>
  );
}
