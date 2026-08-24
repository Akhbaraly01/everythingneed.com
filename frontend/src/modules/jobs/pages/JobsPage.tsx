import { useQuery } from "@tanstack/react-query";
import { http, qs } from "@/core/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Job { id: string; title: string; company: string; location: string; salary_range: string; category: string; created_at: string; }

export default function JobsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", search],
    queryFn: async () => { const res = await http.get<any>(`/api/jobs${qs({ q: search })}`); return res.data || []; },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Jobs</h1>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div> :
        <div className="space-y-4">
          {jobs?.map((j: Job) => (
            <Card key={j.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/jobs/${j.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><h3 className="font-semibold">{j.title}</h3><p className="text-sm text-muted-foreground">{j.company}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</p></div>
                <div className="text-right"><Badge variant="outline">{j.category}</Badge>{j.salary_range && <p className="text-sm font-medium flex items-center gap-1 mt-1"><DollarSign className="h-3 w-3" />{j.salary_range}</p>}</div>
              </CardContent>
            </Card>
          ))}
          {jobs?.length === 0 && <p className="text-center py-12 text-muted-foreground">No jobs found</p>}
        </div>}
    </div>
  );
}
