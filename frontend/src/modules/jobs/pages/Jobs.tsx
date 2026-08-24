import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
// eslint-disable-next-line no-restricted-imports -- JobCard belongs to jobs module, reused here
import JobCard from "../components/JobCard";
// eslint-disable-next-line no-restricted-imports -- BookingRequestForm is a shared booking component
import { BookingRequestForm } from "@modules/bookings";
import { ArrowLeft, Search, Briefcase, Users, Building, MapPin, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Badge } from "@shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  type: string;
  salary?: string;
  description?: string;
  posted?: string;
}

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await http.get<any>(`${API}/jobs?per_page=100`);
        const raw = res?.data || res || [];
        setJobs((Array.isArray(raw) ? raw : []).map((j: any) => ({
          id: j.id,
          title: j.title,
          company: j.company || j.employer?.company_name || "",
          location: j.location || j.city,
          type: j.type || j.employment_type || "Full-time",
          salary: j.salary || j.salary_range,
          description: j.description,
          posted: j.created_at,
        })));
      } catch (e) {
        console.error("Failed to load jobs:", e);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const jobTypes = ["Full-time", "Part-time", "Contract", "Remote"];

  const filteredJobs = jobs.filter(job => 
    (searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedType === "" || selectedType === "all" || job.type === selectedType)
  );

  const handleApply = (job: Job) => {
    toast({
      title: "Application Started!",
      description: `Applying for ${job.title} at ${job.company}. Please complete your application form.`,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Jobs & Careers</h1>
          <p className="text-white/90">Find your dream job or post opportunities for talented professionals</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,250+</p>
                <p className="text-xs text-muted-foreground">Active Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">500+</p>
                <p className="text-xs text-muted-foreground">Companies</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-xs text-muted-foreground">Job Seekers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search jobs or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="jobs">Browse Jobs</TabsTrigger>
            <TabsTrigger value="seekers">Job Seekers</TabsTrigger>
            <TabsTrigger value="post">Post a Job</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} onApply={handleApply} />
              ))}
            </div>
            {filteredJobs.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="seekers">
            <Card className="p-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-2">Find Talented Professionals</h3>
                <p className="text-muted-foreground mb-6">
                  Browse our pool of skilled job seekers from professors to skilled tradespeople.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {["Developers", "Designers", "Marketers", "Writers", "Engineers", "Farmers", "Builders", "Drivers"].map((role) => (
                    <Badge key={role} variant="outline" className="py-2 cursor-pointer hover:bg-accent">
                      {role}
                    </Badge>
                  ))}
                </div>
                <BookingRequestForm 
                  serviceTypes={[
                    "Full-time Employee",
                    "Part-time Employee",
                    "Contract Worker",
                    "Freelancer",
                    "Consultant",
                    "Intern"
                  ]}
                  title="Request Workers"
                  description="Tell us what kind of staff you need and we'll match you with the right candidates."
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="post">
            <Card className="p-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-2">Post a Job Opening</h3>
                <p className="text-muted-foreground mb-6">
                  Reach thousands of qualified candidates. Our team will help match you with the best talent.
                </p>
                <BookingRequestForm 
                  serviceTypes={[
                    "Full-time Position",
                    "Part-time Position",
                    "Contract Work",
                    "Remote Position",
                    "Internship",
                    "Freelance Project"
                  ]}
                  title="Post Job Opening"
                  description="Provide job details and requirements. We'll review and publish your listing."
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Jobs;
