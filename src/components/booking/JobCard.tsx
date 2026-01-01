import { JobListing } from "@/data/bookingData";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase, DollarSign } from "lucide-react";

interface JobCardProps {
  job: JobListing;
  onApply: (job: JobListing) => void;
}

const JobCard = ({ job, onApply }: JobCardProps) => {
  const typeColors = {
    "Full-time": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "Part-time": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "Contract": "bg-orange-500/10 text-orange-600 border-orange-500/20",
    "Remote": "bg-green-500/10 text-green-600 border-green-500/20",
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <Badge className={typeColors[job.type]}>
            {job.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>{job.experience}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{job.salary}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{job.posted}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" onClick={() => onApply(job)}>
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
