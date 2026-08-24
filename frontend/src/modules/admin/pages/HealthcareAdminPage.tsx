import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { DataTable, type ColumnDef } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Stethoscope, Calendar, Star, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { healthcareApi } from "../services";

type Doctor = {
  id: string; name: string; specialty: string; status: string; rating: number; consultations: number; fee: string;
};
type Appointment = {
  id: string; patient: string; doctor: string; type: string; status: string; date: string;
};
type PharmacyProduct = {
  id: string; name: string; category: string; stock: number; price: string; status: string;
};

export default function HealthcareAdminPage() {
  const [doctorSearch, setDoctorSearch] = useState("");
  const [apptSearch, setApptSearch] = useState("");
  const [pharmaSearch, setPharmaSearch] = useState("");

  const { data: doctorsRes } = useQuery({
    queryKey: ["healthcare", "doctors", doctorSearch],
    queryFn: () => healthcareApi.doctors({ search: doctorSearch || undefined }),
  });

  const { data: appointmentsRes } = useQuery({
    queryKey: ["healthcare", "appointments", apptSearch],
    queryFn: () => healthcareApi.appointments({ search: apptSearch || undefined }),
  });

  const { data: pharmacyRes } = useQuery({
    queryKey: ["healthcare", "pharmacy", pharmaSearch],
    queryFn: () => healthcareApi.pharmacy({ search: pharmaSearch || undefined }),
  });

  const doctors: Doctor[] = (doctorsRes?.data ?? []).map((d) => ({
    id: d.id,
    name: d.full_name,
    specialty: d.specialization,
    status: d.is_available ? "active" : "suspended",
    rating: d.rating,
    consultations: 0,
    fee: "$80",
  }));

  const appointments: Appointment[] = (appointmentsRes?.data ?? []).map((a) => ({
    id: a.id,
    patient: a.patient_name,
    doctor: a.doctor_name,
    type: "Video Call",
    status: a.status,
    date: a.date,
  }));

  const pharmacy: PharmacyProduct[] = (pharmacyRes?.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    stock: p.stock,
    price: `$${p.price.toFixed(2)}`,
    status: p.stock === 0 ? "out_of_stock" : p.stock < 100 ? "low_stock" : "active",
  }));

  const doctorCols: ColumnDef<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {r.name.split(" ").pop()?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{r.name}</p>
            <p className="text-xs text-slate-500">{r.specialty}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "rating",
      header: "Rating",
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <span className="text-xs font-medium">{r.rating}</span>
        </div>
      ),
    },
    { key: "consultations", header: "Consultations", render: (r) => <span className="text-sm text-slate-300">{r.consultations.toLocaleString()}</span> },
    { key: "fee", header: "Fee/Session", render: (r) => <span className="text-sm font-semibold text-emerald-400">{r.fee}</span> },
    {
      key: "actions", header: "Actions", align: "right",
      render: (r) => (
        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-700" onClick={() => toast.info(`Viewing ${r.name}`)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const apptCols: ColumnDef<Appointment>[] = [
    { key: "patient", header: "Patient", render: (r) => <span className="text-sm text-slate-200">{r.patient}</span> },
    { key: "doctor", header: "Doctor", render: (r) => <span className="text-xs text-slate-400">{r.doctor}</span> },
    { key: "type", header: "Type", render: (r) => <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{r.type}</Badge> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date", sortable: true, render: (r) => <span className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</span> },
  ];

  const pharmaCols: ColumnDef<PharmacyProduct>[] = [
    { key: "name", header: "Product", render: (r) => <span className="text-sm font-medium text-slate-200">{r.name}</span> },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{r.category}</Badge> },
    {
      key: "stock", header: "Stock", render: (r) => (
        <span className={`text-sm font-medium ${r.stock === 0 ? "text-red-400" : r.stock < 100 ? "text-amber-400" : "text-slate-300"}`}>
          {r.stock}
        </span>
      ),
    },
    { key: "price", header: "Price", render: (r) => <span className="text-sm font-semibold text-emerald-400">{r.price}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <AdminLayout title="Healthcare" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Healthcare" }]}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Healthcare Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Manage doctors, appointments, and pharmacy inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-teal-400">{doctors.filter((d) => d.status === "active").length}</p>
              <p className="text-xs text-slate-500">Active Doctors</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-400">{appointments.filter((a) => a.status === "scheduled").length}</p>
              <p className="text-xs text-slate-500">Scheduled</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="doctors" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            <TabsTrigger value="doctors" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Appointments
            </TabsTrigger>
            <TabsTrigger value="pharmacy" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              Pharmacy
            </TabsTrigger>
          </TabsList>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
            <TabsContent value="doctors">
              <DataTable columns={doctorCols} data={doctors}
                searchValue={doctorSearch} onSearchChange={setDoctorSearch} />
            </TabsContent>
            <TabsContent value="appointments">
              <DataTable columns={apptCols} data={appointments}
                searchValue={apptSearch} onSearchChange={setApptSearch} />
            </TabsContent>
            <TabsContent value="pharmacy">
              <DataTable columns={pharmaCols} data={pharmacy}
                searchValue={pharmaSearch} onSearchChange={setPharmaSearch} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
