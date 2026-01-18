import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Search, Share2, Eye, Calendar, GraduationCap, CheckCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateCertificatePDF, printCertificate } from "@/utils/certificateGenerator";

interface Certificate {
  id: string;
  certificate_number: string;
  course_title: string;
  instructor_name: string;
  issued_at: string;
  course_id: string | null;
}

const Certificates = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["user-certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!user,
  });

  const filteredCertificates = certificates.filter(cert =>
    cert.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (cert: Certificate) => {
    generateCertificatePDF({
      studentName: user?.email || "Student",
      courseTitle: cert.course_title,
      instructorName: cert.instructor_name,
      certificateNumber: cert.certificate_number,
      issueDate: new Date(cert.issued_at)
    });
    toast.success("Certificate downloaded!");
  };

  const handlePrint = (cert: Certificate) => {
    printCertificate({
      studentName: user?.email || "Student",
      courseTitle: cert.course_title,
      instructorName: cert.instructor_name,
      certificateNumber: cert.certificate_number,
      issueDate: new Date(cert.issued_at)
    });
  };

  const handleShare = async (cert: Certificate) => {
    const shareText = `I completed "${cert.course_title}" and earned a certificate! #Learning #Achievement`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Certificate",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share text copied to clipboard!");
    }
  };

  const CertificatePreview = ({ cert }: { cert: Certificate }) => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-4 border-double border-amber-600 rounded-lg p-8 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center">
          <Award className="h-10 w-10 text-white" />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
        <h2 className="text-2xl font-serif font-bold">This is to certify that</h2>
      </div>
      
      <p className="text-xl font-semibold text-primary border-b-2 border-primary/30 pb-2 inline-block px-8">
        {user?.email || "Student"}
      </p>
      
      <p className="text-lg">has successfully completed</p>
      
      <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400">
        "{cert.course_title}"
      </h3>
      
      <div className="pt-4 space-y-2 text-sm text-muted-foreground">
        <p>Instructor: <span className="font-medium">{cert.instructor_name}</span></p>
        <p>Certificate ID: <span className="font-mono">{cert.certificate_number}</span></p>
        <p>Issued: {format(new Date(cert.issued_at), "MMMM dd, yyyy")}</p>
      </div>
      
      <div className="pt-4">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
        <p className="text-xs text-muted-foreground mt-1">Verified Certificate</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen pb-20 pt-6">
        <div className="container mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to view your certificates</p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            My Certificates
          </h1>
          <p className="text-white/90 max-w-xl mx-auto">
            View and download your earned certificates from completed courses
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-4 py-1">
              {certificates.length} Certificate{certificates.length !== 1 ? "s" : ""} Earned
            </Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {cert.certificate_number}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {cert.course_title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {cert.instructor_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Issued {format(new Date(cert.issued_at), "MMM dd, yyyy")}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Certificate Preview</DialogTitle>
                        </DialogHeader>
                        <CertificatePreview cert={cert} />
                        <div className="flex gap-2 justify-end mt-4">
                          <Button variant="outline" onClick={() => handleShare(cert)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button variant="outline" onClick={() => handlePrint(cert)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                          <Button onClick={() => handleDownload(cert)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No Certificates Found" : "No Certificates Yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Complete courses in the Learn section to earn certificates"}
              </p>
              <Button asChild>
                <a href="/learn">Explore Courses</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Certificates;
