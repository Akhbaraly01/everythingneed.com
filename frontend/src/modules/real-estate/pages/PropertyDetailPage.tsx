import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Bed, Bath, Maximize } from "lucide-react";

interface Property { id: string; title: string; description: string; price: number; location: string; property_type: string; bedrooms: number; bathrooms: number; area_sqft: number; image?: string; }

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["property", id], enabled: !!id,
    queryFn: async () => { const { data } = await http.get<any>(`/api/properties/${id}`); return data.data; },
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div>;
  if (!property) return <div className="text-center py-12"><p>Property not found</p><Button variant="link" onClick={() => navigate("/properties")}>Back</Button></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{property.location}</p></div>
        <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
      </div>
      {property.image && <img src={property.image} alt={property.title} className="w-full h-80 object-cover rounded-lg" />}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><Bed className="h-5 w-5 mx-auto mb-1" /><p className="font-bold">{property.bedrooms}</p><p className="text-xs text-muted-foreground">Bedrooms</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Bath className="h-5 w-5 mx-auto mb-1" /><p className="font-bold">{property.bathrooms}</p><p className="text-xs text-muted-foreground">Bathrooms</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Maximize className="h-5 w-5 mx-auto mb-1" /><p className="font-bold">{property.area_sqft}</p><p className="text-xs text-muted-foreground">Sq Ft</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{property.description}</p></CardContent></Card>
      <Card><CardContent className="flex items-center justify-between"><p className="text-2xl font-bold">${property.price?.toLocaleString()}</p><Button size="lg">Contact Agent</Button></CardContent></Card>
    </div>
  );
}
