import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Headphones, Plus, Search } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    http.get<any>(`${API}/support/tickets`).then(res => setTickets(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => t.subject?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Headphones className="h-8 w-8" /> Support Tickets</h1>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-48" /></div>
          <Button><Plus className="h-4 w-4 mr-1" />New Ticket</Button>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(ticket => (
          <Card key={ticket.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground">{ticket.description?.slice(0, 100)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={ticket.status === "open" ? "destructive" : ticket.status === "resolved" ? "default" : "secondary"}>{ticket.status}</Badge>
                  <Badge variant="outline">{ticket.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No tickets</p>}
      </div>
    </div>
  );
}
