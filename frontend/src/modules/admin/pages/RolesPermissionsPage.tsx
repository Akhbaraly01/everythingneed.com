import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { http } from "@core/api";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

interface RoleCount {
  role: string;
  user_count: number;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_OPTIONS = [
  "super_admin", "administrator", "vendor_admin", "moderator",
  "support_staff", "content_manager", "finance_admin",
  "healthcare_admin", "learning_admin", "customer_service",
  "category_admin", "user",
];

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleSearch, setRoleSearch] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<string>("");

  const rolesRes = useQuery({
    queryKey: ["rbac", "roles"],
    queryFn: () => http.get<{ data: RoleCount[] }>(`${API}/admin/roles`),
  });
  const permissionsRes = useQuery({
    queryKey: ["rbac", "permissions"],
    queryFn: () => http.get<{ data: Record<string, string[]> }>(`${API}/admin/permissions`),
  });
  const usersRes = useQuery({
    queryKey: ["rbac", "user-search", roleSearch],
    queryFn: () => http.get<{ data: { data: AdminUserRow[] } }>(
      `${API}/admin/users?limit=10${roleSearch ? `&search=${encodeURIComponent(roleSearch)}` : ""}`
    ),
    enabled: roleSearch.length >= 2,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { user_id: string; role: string }) =>
      http.put<{ message: string }>(`${API}/admin/roles/assign`, payload),
    onSuccess: () => {
      toast({ title: "Role assigned", description: "The user's role has been updated." });
      setAssignUserId("");
      setAssignRole("");
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] });
      queryClient.invalidateQueries({ queryKey: ["rbac", "user-search"] });
    },
    onError: () => {
      toast({ title: "Assignment failed", description: "Could not update the user's role.", variant: "destructive" });
    },
  });

  const roles = rolesRes.data?.data ?? [];
  const permissions = permissionsRes.data?.data ?? {};
  const userResults = usersRes.data?.data?.data ?? [];

  return (
    <AdminLayout title="Roles & Permissions">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-violet-500" /> Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rolesRes.isLoading && (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            )}
            {!rolesRes.isLoading && roles.map((r) => (
              <div key={r.role} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm font-medium">{r.role.replace(/_/g, " ")}</span>
                <Badge variant="secondary">{r.user_count} users</Badge>
              </div>
            ))}
            {!rolesRes.isLoading && roles.length === 0 && (
              <p className="text-sm text-muted-foreground">No role data available.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="h-4 w-4 text-indigo-500" /> Assign a role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search user by name or email…"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
              {roleSearch.length >= 2 && userResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setAssignUserId(u.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${assignUserId === u.id ? "bg-violet-500/10 font-medium" : ""}`}
                    >
                      {u.name} <span className="text-muted-foreground">· {u.email}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({u.role})</span>
                    </button>
                  ))}
                </div>
              )}
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger><SelectValue placeholder="Choose role…" /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!assignUserId || !assignRole || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ user_id: assignUserId, role: assignRole })}
              >
                {assignMutation.isPending ? "Assigning…" : "Assign role"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission matrix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(permissions).map(([resource, actions]) => (
                <div key={resource}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{resource}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((a) => (
                      <Badge key={a} variant="outline" className="text-[11px]">
                        {resource}.{a}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
