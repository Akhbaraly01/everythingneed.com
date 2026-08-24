import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { FormModal } from "../components/FormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { cmsApi } from "../services";

type ContentItem = {
  id: string; title: string; author: string; status: string; date: string; views?: number;
};

function ContentTable({ items, onAdd, onDelete }: { items: ContentItem[]; onAdd: () => void; onDelete?: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);

  const filtered = items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));

  const columns: ColumnDef<ContentItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => <span className="text-sm font-medium text-slate-200">{row.title}</span>,
    },
    {
      key: "author",
      header: "Author",
      render: (row) => <span className="text-xs text-slate-400">{row.author}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.date).toLocaleDateString()}</span>,
    },
    ...(items[0]?.views !== undefined ? [{
      key: "views",
      header: "Views",
      render: (row: ContentItem) => <span className="text-xs text-slate-400">{row.views?.toLocaleString() ?? "—"}</span>,
    }] : []),
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-40">
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 text-xs">
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem onClick={() => setDeleteTarget(row)} className="text-red-400 focus:bg-red-900/20 text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button size="sm" onClick={onAdd} className="h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add New
        </Button>
      </div>
      <DataTable columns={columns} data={filtered} searchValue={search} onSearchChange={setSearch}
        exportOptions={{ onExportCsv: () => toast.success("Exporting...") }}
      />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Content" description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={() => { onDelete?.(deleteTarget?.id ?? ""); setDeleteTarget(null); }} confirmLabel="Delete" variant="destructive" />
    </>
  );
}

export default function ContentManagerPage() {
  const [addModal, setAddModal] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: pagesRes } = useQuery({
    queryKey: ["cms", "pages"],
    queryFn: () => cmsApi.pages.list(),
  });

  const { data: blogRes } = useQuery({
    queryKey: ["cms", "blog"],
    queryFn: () => cmsApi.blog.list(),
  });

  const { data: bannersRes } = useQuery({
    queryKey: ["cms", "banners"],
    queryFn: () => cmsApi.banners.list(),
  });

  const { data: announcementsRes } = useQuery({
    queryKey: ["cms", "announcements"],
    queryFn: () => cmsApi.announcements.list(),
  });

  const pages = (pagesRes?.data ?? []).map((p) => ({
    id: p.id, title: p.title, author: "Admin", status: p.status, date: p.updated_at,
  }));

  const blogs = (blogRes?.data ?? []).map((b) => ({
    id: b.id, title: b.title, author: b.author, status: b.status, date: b.published_at,
  }));

  const banners = (bannersRes?.data ?? []).map((b) => ({
    id: b.id, title: b.title, author: "Design Team", status: b.is_active ? "active" : "draft", date: "",
  }));

  const announcements = (announcementsRes?.data ?? []).map((a) => ({
    id: a.id, title: a.title, author: "Admin", status: a.is_active ? "active" : "draft", date: "",
  }));

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["cms"] });
  };

  const deletePage = useMutation({
    mutationFn: (id: string) => cmsApi.pages.delete(id),
    onSuccess: () => { toast.success("Page deleted"); invalidateAll(); },
  });

  const deleteBlog = useMutation({
    mutationFn: (id: string) => cmsApi.blog.delete(id),
    onSuccess: () => { toast.success("Blog post deleted"); invalidateAll(); },
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => cmsApi.banners.delete(id),
    onSuccess: () => { toast.success("Banner deleted"); invalidateAll(); },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => cmsApi.announcements.delete(id),
    onSuccess: () => { toast.success("Announcement deleted"); invalidateAll(); },
  });

  return (
    <AdminLayout title="CMS" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Content" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Content Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Manage pages, blog posts, banners, and announcements</p>
        </div>

        <Tabs defaultValue="pages" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            {["pages", "blog", "banners", "announcements"].map((t) => (
              <TabsTrigger key={t} value={t} className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <TabsContent value="pages"><ContentTable items={pages} onAdd={() => setAddModal("Page")} onDelete={(id) => deletePage.mutate(id)} /></TabsContent>
            <TabsContent value="blog"><ContentTable items={blogs} onAdd={() => setAddModal("Blog Post")} onDelete={(id) => deleteBlog.mutate(id)} /></TabsContent>
            <TabsContent value="banners"><ContentTable items={banners} onAdd={() => setAddModal("Banner")} onDelete={(id) => deleteBanner.mutate(id)} /></TabsContent>
            <TabsContent value="announcements"><ContentTable items={announcements} onAdd={() => setAddModal("Announcement")} onDelete={(id) => deleteAnnouncement.mutate(id)} /></TabsContent>
          </div>
        </Tabs>
      </div>

      <FormModal open={!!addModal} onOpenChange={(v) => !v && setAddModal(null)}
        title={`Add New ${addModal}`}
        onSubmit={() => { toast.success(`${addModal} created`); setAddModal(null); setNewTitle(""); }}
        submitLabel="Create"
      >
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Title</Label>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter title..." className="bg-slate-800 border-slate-700 text-slate-200 text-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs">Status</Label>
          <select className="w-full h-9 px-3 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </FormModal>
    </AdminLayout>
  );
}
