import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Ticket, Clock, CheckCircle, Zap, MoreHorizontal, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { supportApi } from "../services";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-600/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

export default function SupportStaffPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("open");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", search, activeTab],
    queryFn: () => supportApi.list({ search, status: activeTab }),
  });

  const tickets = data?.data ?? [];
  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) => supportApi.assign(id, staffId),
    onSuccess: () => {
      toast.success("Ticket assigned");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: () => toast.error("Failed to assign ticket"),
  });

  const columns: ColumnDef<any>[] = [
    {
      key: "id",
      header: "#",
      render: (row) => <span className="text-xs font-mono text-violet-400">#{row.id.slice(-4).toUpperCase()}</span>,
      width: "60px",
    },
    {
      key: "subject",
      header: "Subject",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{row.subject}</p>
          <p className="text-xs text-slate-500">User #{row.user_id}</p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${PRIORITY_COLORS[row.priority] ?? PRIORITY_COLORS.low}`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "assigned_to",
      header: "Agent",
      render: (row) => (
        <span className={`text-xs ${!row.assigned_to ? "text-slate-500 italic" : "text-slate-300"}`}>
          {row.assigned_to || "Unassigned"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
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
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-40">
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 text-xs">
              <MoreHorizontal className="w-3.5 h-3.5 mr-2" /> View Ticket
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => assignMutation.mutate({ id: row.id, staffId: "current-user" })}
              className="text-slate-300 focus:bg-slate-700 text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-2" /> Assign to Me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout title="Support" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Support Tickets" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Support Center</h1>
          <p className="text-sm text-slate-400 mt-1">Manage customer tickets, complaints and escalations</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Open Tickets" value={open} icon={<Ticket className="w-4 h-4" />} color="danger" />
          <StatCard title="In Progress" value={inProgress} icon={<Clock className="w-4 h-4" />} color="warning" />
          <StatCard title="Resolved Today" value={resolved} icon={<CheckCircle className="w-4 h-4" />} color="success" />
          <StatCard title="Avg Response" value="2.4h" icon={<Zap className="w-4 h-4" />} color="info" trend={{ value: 15, isPositive: true, label: "faster" }} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            {[
              { value: "open", label: `Open (${open})` },
              { value: "in_progress", label: `In Progress (${inProgress})` },
              { value: "resolved", label: "Resolved" },
              { value: "all", label: "All" },
            ].map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <TabsContent value={activeTab}>
              <DataTable
                columns={columns}
                data={tickets}
                isLoading={isLoading}
                searchValue={search}
                onSearchChange={setSearch}
                exportOptions={{ onExportCsv: () => toast.success("Exporting tickets...") }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
