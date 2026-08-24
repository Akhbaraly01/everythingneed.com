import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function StoresPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Store className="h-8 w-8" /> Stores</h1>
      <Card><CardHeader><CardTitle>Store Directory</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Browse vendor stores and their products.</p></CardContent>
      </Card>
    </div>
  );
}
