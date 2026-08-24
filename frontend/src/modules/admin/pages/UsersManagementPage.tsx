import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormModal } from "../components/FormModal";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Select } from "@shared/ui/select";
import { Label } from "@shared/ui/label";
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@shared/ui/select";
import {
  Users, UserCheck, UserPlus, UserX,
  MoreHorizontal, Shield, Trash2, Ban, RefreshCw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usersApi } from "../services";

const ROLES = [
  "super_admin", "administrator", "vendor_admin", "moderator",
  "support_staff", "content_manager", "finance_admin",
  "healthcare_admin", "learning_admin", "customer_service", "user",
];

export default function UsersManagementPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string; status: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: () => usersApi.list({ search, role: roleFilter, page }),
  });

  const users = data?.data ?? [];

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => usersApi.suspend(id),
    onSuccess: () => {
      toast.success("User suspended");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: () => {
      toast.success("User restored");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to restore user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.destroy(id),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const handleSelectAll = () => {
    setSelectedRows((prev) => prev.length === users.length ? [] : users.map((u) => u.id));
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge variant="outline" className="text-[10px] capitalize border-slate-600 text-slate-300 bg-slate-800/50">
          {row.role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" aria-label="Row actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
            <DropdownMenuItem
              onClick={() => { setRoleTarget(row); setNewRole(row.role); }}
              className="text-slate-300 focus:bg-slate-700 text-xs"
            >
              <Shield className="w-3.5 h-3.5 mr-2" /> Change Role
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSuspendTarget(row)}
              className="text-slate-300 focus:bg-slate-700 text-xs"
            >
              {row.status === "suspended" ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-2" /> Restore</>
              ) : (
                <><Ban className="w-3.5 h-3.5 mr-2" /> Suspend</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={() => setDeleteTarget(row)}
              className="text-red-400 focus:bg-red-900/20 focus:text-red-300 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const active = users.filter((u) => u.status === "active").length;
  const suspended = users.filter((u) => u.status === "suspended" || u.status === "banned").length;

  return (
    <AdminLayout title="Users Management" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all platform users, roles, and access</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={data?.total ?? 0} icon={<Users className="w-4 h-4" />} color="primary" trend={{ value: 12, isPositive: true, label: "vs last month" }} />
          <StatCard title="Active Users" value={active} icon={<UserCheck className="w-4 h-4" />} color="success" />
          <StatCard title="New This Month" value={3} icon={<UserPlus className="w-4 h-4" />} color="info" trend={{ value: 8, isPositive: true, label: "vs last month" }} />
          <StatCard title="Suspended" value={suspended} icon={<UserX className="w-4 h-4" />} color="warning" />
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            searchValue={search}
            onSearchChange={setSearch}
            filterSlot={
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-violet-500"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            }
            bulkActions={[
              { label: "Suspend", onClick: (ids) => { toast.success(`Suspended ${ids.length} users`); setSelectedRows([]); }, variant: "destructive" },
              { label: "Export", onClick: (ids) => toast.success(`Exporting ${ids.length} users`) },
            ]}
            exportOptions={{
              onExportCsv: () => toast.success("Exporting CSV..."),
              onExportPdf: () => toast.success("Exporting PDF..."),
            }}
            pagination={{ page, perPage: 20, total: data?.total ?? 0, onPageChange: setPage }}
          />
        </div>
      </div>

      {/* Change Role Modal */}
      <FormModal
        open={!!roleTarget}
        onOpenChange={(v) => !v && setRoleTarget(null)}
        title="Change User Role"
        description={`Update role for ${roleTarget?.name}`}
        onSubmit={async () => {
          if (!roleTarget) return;
          await roleMutation.mutateAsync({ id: roleTarget.id, role: newRole });
          setRoleTarget(null);
        }}
        submitLabel="Update Role"
      >
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">New Role</Label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </FormModal>

      {/* Suspend Dialog */}
      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(v) => !v && setSuspendTarget(null)}
        title={suspendTarget?.status === "suspended" ? "Restore User" : "Suspend User"}
        description={`Are you sure you want to ${suspendTarget?.status === "suspended" ? "restore" : "suspend"} ${suspendTarget?.name}?`}
        onConfirm={async () => {
          if (!suspendTarget) return;
          if (suspendTarget.status === "suspended") {
            await restoreMutation.mutateAsync(suspendTarget.id);
          } else {
            await suspendMutation.mutateAsync(suspendTarget.id);
          }
          setSuspendTarget(null);
        }}
        confirmLabel={suspendTarget?.status === "suspended" ? "Restore" : "Suspend"}
        variant={suspendTarget?.status === "suspended" ? "default" : "destructive"}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete User"
        description={`Permanently delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </AdminLayout>
  );
}
