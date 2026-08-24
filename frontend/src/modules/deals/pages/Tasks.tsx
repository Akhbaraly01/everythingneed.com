import { useState } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { http } from "@core/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Users, DollarSign, Loader2, CheckCircle2, ClipboardList, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

interface TaskPost {
  id: string;
  post_number: string;
  title: string;
  description: string;
  quantity: number;
  budget: string;
  deadline?: string;
  status: string;
  created_at: string;
  applications_count?: number;
}

interface TaskApplication {
  worker?: { id: string; name: string } | null;
  id: string;
  task_post_id: string;
  status: string;
  message: string | null;
  evidence_note?: string | null;
  payout?: string | null;
  task?: TaskPost;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  in_review: "bg-blue-100 text-blue-800",
  assigned: "bg-indigo-100 text-indigo-800",
  completed: "bg-teal-100 text-teal-800",
  cancelled: "bg-red-100 text-red-800",
};

const APP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  submitted: "bg-blue-100 text-blue-800",
  verified: "bg-violet-100 text-violet-800",
  paid: "bg-teal-100 text-teal-800",
};

const Tasks = () => {
  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-primary py-8">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to Deals
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Task Center</h1>
          <p className="text-primary-foreground/80 mt-1">
            Post micro-jobs or earn by completing tasks for others
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="board" className="space-y-5">
          <TabsList>
            <TabsTrigger value="board">Task Board</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="posted">Tasks I Posted</TabsTrigger>
          </TabsList>
          <TabsContent value="board"><TaskBoard /></TabsContent>
          <TabsContent value="applications"><MyApplications /></TabsContent>
          <TabsContent value="posted"><PostedTasks /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ── Public board ───────────────────────────────────────────────────

function TaskBoard() {
  const [applyTask, setApplyTask] = useState<TaskPost | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const boardRes = useQuery({
    queryKey: ["tasks", "board"],
    queryFn: () => http.get<{ data: TaskPost[] }>(`${API}/tasks?per_page=50`).then((r) => r.data ?? []),
  });

  const applyMutation = useMutation({
    mutationFn: (taskId: string) => http.post(`${API}/tasks/${taskId}/apply`, {}),
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "Track it under My Applications." });
      setApplyTask(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) =>
      toast({
        title: "Could not apply",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  if (boardRes.isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  }

  return (
    <>
      {(boardRes.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-2">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No open tasks right now</p>
            <p className="text-sm text-muted-foreground">Be the first — post a task others can complete.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(boardRes.data ?? []).map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.post_number} · Qty {task.quantity}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[task.status]}>{task.status.replace("_", " ")}</Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />{Number(task.budget).toFixed(0)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />{task.applications_count ?? 0} applied
                    </span>
                  </div>

                  <Dialog open={applyTask?.id === task.id} onOpenChange={(v) => setApplyTask(v ? task : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Send className="h-4 w-4 mr-1" /> Apply</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply: {task.title}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <Button
                        className="w-full"
                        disabled={applyMutation.isPending}
                        onClick={() => applyMutation.mutate(task.id)}
                      >
                        {applyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Confirm application
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ── Worker's applications ──────────────────────────────────────────

function MyApplications() {
  const appsRes = useQuery({
    queryKey: ["my-task-applications"],
    queryFn: () => http.get<{ data: TaskApplication[] }>(`${API}/my-task-applications`).then((r) => r.data ?? []),
  });

  const submitMutation = useMutation({
    mutationFn: ({ applicationId, note }: { applicationId: string; note: string }) =>
      http.post(`${API}/task-applications/${applicationId}/submit`, { evidence_note: note }),
    onSuccess: () => {
      void appsRes.refetch();
    },
  });

  if (appsRes.isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <SubmitWrapper apps={appsRes.data ?? []} onSubmit={(id, note) => submitMutation.mutate({ applicationId: id, note })} submitting={submitMutation.isPending} />
  );
}

function SubmitWrapper({
  apps, onSubmit, submitting,
}: {
  apps: TaskApplication[];
  onSubmit: (id: string, note: string) => void;
  submitting: boolean;
}) {
  const [note, setNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't applied to any tasks yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {apps.map((app) => (
        <Card key={app.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{app.task?.title ?? "Task"}</p>
                <p className="text-xs text-muted-foreground">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className={APP_STATUS_COLORS[app.status]}>{app.status}</Badge>
            </div>

            {app.evidence_note && (
              <p className="text-xs text-muted-foreground border-l-2 pl-2">{app.evidence_note}</p>
            )}

            {app.payout && app.status === "paid" && (
              <p className="text-sm font-semibold text-teal-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Paid ${Number(app.payout).toFixed(2)}
              </p>
            )}

            {app.status === "approved" && (
              <div className="space-y-2 pt-1">
                <Textarea
                  rows={2}
                  placeholder="Describe the completed work…"
                  value={activeId === app.id ? note : ""}
                  onChange={(e) => { setActiveId(app.id); setNote(e.target.value); }}
                />
                <Button
                  size="sm"
                  disabled={!note.trim() || submitting}
                  onClick={() => onSubmit(app.id, note)}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Submit evidence
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Owner view: posted tasks + review flow ─────────────────────────

function PostedTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const postedRes = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: () => http.get<{ data: TaskPost[] }>(`${API}/tasks?mine=true&per_page=50`).then((r) => r.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; budget: number; quantity: number; deadline?: string }) =>
      http.post(`${API}/tasks`, payload),
    onSuccess: () => {
      toast({ title: "Task published!" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) =>
      toast({
        title: "Could not publish task",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  const reviewResFor = (taskId: string) =>
    useQuery({
      queryKey: ["task-applications", taskId],
      queryFn: () => http.get<{ data: TaskApplication[] }>(`${API}/tasks/${taskId}/applications`).then((r) => r.data ?? []),
      enabled: !!taskId,
    });

  const actionMutation = useMutation({
    mutationFn: ({ applicationId, action }: { applicationId: string; action: string }) =>
      http.post(`${API}/task-applications/${applicationId}/${action}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-applications"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) =>
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  return (
    <div className="space-y-5">
      {/* Post a new task */}
      <NewTaskForm onCreate={(payload) => createMutation.mutate(payload)} creating={createMutation.isPending} />

      {postedRes.isLoading ? (
        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
      ) : (postedRes.data ?? []).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          You haven't posted any tasks yet.
        </CardContent></Card>
      ) : (
        (postedRes.data ?? []).map((task) => <PostedTaskRow key={task.id} task={task} actionMutation={actionMutation} />)
      )}
    </div>
  );
}

function PostedTaskRow({
  task, actionMutation,
}: {
  task: TaskPost;
  actionMutation: ReturnType<typeof useMutation<any, Error, { applicationId: string; action: string }>>;
}) {
  const [showApps, setShowApps] = useState(false);
  const appsRes = useQuery({
    queryKey: ["task-applications", task.id],
    queryFn: () => http.get<{ data: TaskApplication[] }>(`${API}/tasks/${task.id}/applications`).then((r) => r.data ?? []),
    enabled: showApps,
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {task.post_number} · ${Number(task.budget).toFixed(0)} · {task.applications_count ?? 0} applied
            </p>
          </div>
          <Badge className={STATUS_COLORS[task.status]}>{task.status.replace("_", " ")}</Badge>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowApps((v) => !v)}>
          {showApps ? "Hide applications" : `Review applications (${task.applications_count ?? 0})`}
        </Button>

        {showApps && (
          <div className="rounded-lg border divide-y">
            {appsRes.isLoading && <Skeleton className="h-16 w-full m-3" />}
            {!appsRes.isLoading && (appsRes.data ?? []).length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No applications yet.</p>
            )}
            {(appsRes.data ?? []).map((app) => (
              <div key={app.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{app.worker?.name ?? `Applicant #\${app.id.slice(0, 8)}`}</p>
                    {app.message && <p className="text-xs text-muted-foreground">{app.message}</p>}
                    {app.evidence_note && (
                      <p className="text-xs border-l-2 pl-2 mt-1">Evidence: {app.evidence_note}</p>
                    )}
                  </div>
                  <Badge className={APP_STATUS_COLORS[app.status]}>{app.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {app.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ applicationId: app.id, action: "approve" })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => actionMutation.mutate({ applicationId: app.id, action: "reject" })}>
                        Reject
                      </Button>
                    </>
                  )}
                  {app.status === "submitted" && (
                    <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ applicationId: app.id, action: "verify" })}>
                      Verify work
                    </Button>
                  )}
                  {app.status === "verified" && (
                    <Button size="sm" onClick={() => actionMutation.mutate({ applicationId: app.id, action: "mark-paid" })}>
                      Release payment (${Number(task.budget).toFixed(0)})
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewTaskForm({ onCreate, creating }: { onCreate: (p: { title: string; description: string; budget: number; quantity: number; deadline?: string }) => void; creating: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", budget: "", quantity: "1", deadline: "" });

  const submit = () => {
    onCreate({
      title: form.title,
      description: form.description,
      budget: Number(form.budget),
      quantity: Number(form.quantity) || 1,
      deadline: form.deadline || undefined,
    });
    setOpen(false);
    setForm({ title: "", description: "", budget: "", quantity: "1", deadline: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Post a Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Publish a new task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title *</Label>
            <Input id="t-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Distribute flyers downtown" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description *</Label>
            <Textarea id="t-desc" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-budget">Budget ($) *</Label>
              <Input id="t-budget" type="number" min={1} required value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-qty">Quantity</Label>
              <Input id="t-qty" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-deadline">Deadline (optional)</Label>
            <input id="t-deadline" type="date" min={new Date().toISOString().slice(0, 10)} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          <Button className="w-full" disabled={!form.title || !form.description || !form.budget || creating} onClick={submit}>
            {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Publish task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Tasks;
