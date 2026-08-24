import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function PrescriptionsPage() {
  const navigate = useNavigate();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: () => http.get<{ data: any[] }>("/api/prescriptions").then((res) => res.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/healthcare")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold">My Prescriptions</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading prescriptions...</div>
      ) : !prescriptions || prescriptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No prescriptions found.
        </div>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((rx: any) => (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Dr. {rx.doctor?.name || rx.doctor_name || "Doctor"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Date:{" "}
                      {new Date(rx.date || rx.prescription_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rx.diagnosis && (
                  <div>
                    <h4 className="font-medium text-sm">Diagnosis</h4>
                    <p className="text-muted-foreground text-sm">{rx.diagnosis}</p>
                  </div>
                )}

                {rx.medications && rx.medications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Medications</h4>
                    <ul className="space-y-1">
                      {rx.medications.map((med: any, idx: number) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Badge variant="outline" className="text-xs">
                            {med.dosage || "N/A"}
                          </Badge>
                          <span>{med.name || med}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rx.notes && (
                  <div>
                    <h4 className="font-medium text-sm">Notes</h4>
                    <p className="text-muted-foreground text-sm">{rx.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
