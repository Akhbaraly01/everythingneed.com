import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PermissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Shield className="h-8 w-8" /> Permissions</h1>
      <Card><CardHeader><CardTitle>Role-Based Access Control</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Permissions are managed through the Admin panel. Contact your super administrator to modify role assignments.</p></CardContent>
      </Card>
    </div>
  );
}
