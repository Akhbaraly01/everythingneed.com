import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function RolesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><UserCog className="h-8 w-8" /> Roles</h1>
      <Card><CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Roles define what users can do on the platform. Available roles: super_admin, category_admin, customer_service, user.</p></CardContent>
      </Card>
    </div>
  );
}
