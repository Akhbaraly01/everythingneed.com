import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { StatCard } from "../components/StatCard";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Progress } from "@shared/ui/progress";
import { GraduationCap, Users, Award, DollarSign, Star, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { learningApi } from "../services";

type Course = {
  id: string; title: string; instructor: string; category: string; enrolled: number; rating: number; status: string; revenue: string;
};
type Enrollment = {
  id: string; student: string; course: string; progress: number; started: string; status: string;
};
type Certificate = {
  id: string; student: string; course: string; issued: string; credential: string;
};

export default function LearningAdminPage() {
  const [courseSearch, setCourseSearch] = useState("");
  const [enrollSearch, setEnrollSearch] = useState("");

  const { data: coursesRes } = useQuery({
    queryKey: ["learning", "courses", courseSearch],
    queryFn: () => learningApi.courses({ search: courseSearch || undefined }),
  });

  const { data: enrollmentsRes } = useQuery({
    queryKey: ["learning", "enrollments", enrollSearch],
    queryFn: () => learningApi.enrollments({ search: enrollSearch || undefined }),
  });

  const { data: certificatesRes } = useQuery({
    queryKey: ["learning", "certificates"],
    queryFn: () => learningApi.certificates(),
  });

  const courses: Course[] = (coursesRes?.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    instructor: c.instructor,
    category: "Technology",
    enrolled: c.enrolled_count,
    rating: 4.8,
    status: c.status,
    revenue: `$${c.revenue.toLocaleString()}`,
  }));

  const enrollments: Enrollment[] = (enrollmentsRes?.data ?? []).map((e) => ({
    id: e.id,
    student: e.user_name,
    course: e.course_title,
    progress: e.progress,
    started: e.enrolled_at,
    status: e.progress === 100 ? "completed" : "active",
  }));

  const certificates: Certificate[] = (certificatesRes?.data ?? []).map((c) => ({
    id: c.id,
    student: c.user_name,
    course: c.course_title,
    issued: c.issued_at,
    credential: `CERT-${c.id.slice(0, 6).toUpperCase()}`,
  }));

  const courseCols: ColumnDef<Course>[] = [
    {
      key: "title",
      header: "Course",
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-slate-200">{r.title}</p>
          <p className="text-xs text-slate-500">{r.instructor}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{r.category}</Badge> },
    { key: "enrolled", header: "Enrolled", render: (r) => <span className="text-sm text-slate-300">{r.enrolled.toLocaleString()}</span> },
    {
      key: "rating", header: "Rating",
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <span className="text-xs font-medium">{r.rating}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "revenue", header: "Revenue", render: (r) => <span className="text-sm font-semibold text-emerald-400">{r.revenue}</span> },
    {
      key: "actions", header: "Actions", align: "right",
      render: (r) => (
        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => toast.info(`Viewing ${r.title}`)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const enrollCols: ColumnDef<Enrollment>[] = [
    { key: "student", header: "Student", render: (r) => <span className="text-sm text-slate-200">{r.student}</span> },
    { key: "course", header: "Course", render: (r) => <span className="text-xs text-slate-400 truncate max-w-[160px] block">{r.course}</span> },
    {
      key: "progress", header: "Progress",
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={r.progress} className="h-1.5 flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400 w-8 text-right">{r.progress}%</span>
        </div>
      ),
    },
    { key: "started", header: "Started", render: (r) => <span className="text-xs text-slate-400">{new Date(r.started).toLocaleDateString()}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const certCols: ColumnDef<Certificate>[] = [
    { key: "student", header: "Student", render: (r) => <span className="text-sm text-slate-200">{r.student}</span> },
    { key: "course", header: "Course", render: (r) => <span className="text-xs text-slate-400">{r.course}</span> },
    { key: "credential", header: "Credential ID", render: (r) => <span className="text-xs font-mono text-violet-400">{r.credential}</span> },
    { key: "issued", header: "Issued", render: (r) => <span className="text-xs text-slate-400">{new Date(r.issued).toLocaleDateString()}</span> },
    {
      key: "dl", header: "Action", render: () => (
        <Button variant="ghost" size="sm" className="h-6 text-xs text-violet-400 hover:text-violet-300 px-2" onClick={() => toast.success("Certificate downloaded")}>
          Download
        </Button>
      ),
    },
  ];

  const totalEnrolled = courses.reduce((a, c) => a + c.enrolled, 0);
  const completed = enrollments.filter((e) => e.status === "completed").length;
  const totalRevenue = courses.reduce((a, c) => a + parseInt(c.revenue.replace(/[$,]/g, "")) || 0, 0);

  return (
    <AdminLayout title="Learning" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Learning" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Learning Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Manage courses, enrollments, and certificates</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Courses" value={courses.length} icon={<GraduationCap className="w-4 h-4" />} color="primary" />
          <StatCard title="Active Students" value={totalEnrolled.toLocaleString()} icon={<Users className="w-4 h-4" />} color="info" trend={{ value: 18, isPositive: true, label: "vs last month" }} />
          <StatCard title="Completions" value={completed} icon={<Award className="w-4 h-4" />} color="success" />
          <StatCard title="Course Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4" />} color="warning" trend={{ value: 22, isPositive: true, label: "vs last month" }} />
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            <TabsTrigger value="courses" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Courses</TabsTrigger>
            <TabsTrigger value="enrollments" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Enrollments</TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">Certificates</TabsTrigger>
          </TabsList>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <TabsContent value="courses">
              <DataTable columns={courseCols} data={courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()))}
                searchValue={courseSearch} onSearchChange={setCourseSearch}
                exportOptions={{ onExportCsv: () => toast.success("Exporting...") }} />
            </TabsContent>
            <TabsContent value="enrollments">
              <DataTable columns={enrollCols} data={enrollments.filter((e) => e.student.toLowerCase().includes(enrollSearch.toLowerCase()))}
                searchValue={enrollSearch} onSearchChange={setEnrollSearch} />
            </TabsContent>
            <TabsContent value="certificates">
              <DataTable columns={certCols} data={certificates} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
