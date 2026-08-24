import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Badge } from "@shared/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Calendar } from "@shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { format } from "date-fns";
import { 
  Wrench, Zap, Hammer, Settings, Paintbrush, Home, 
  Star, Clock, MapPin, Phone, CalendarIcon, Loader2, Search, Filter, MessageCircle
} from "lucide-react";
import BookingChat from "../../bookings/components/BookingChat";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  category: string;
  specialty: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  experience: string;
  available: boolean;
  avatar?: string;
  skills: string[];
}

const workerCategories = [
  { id: "electrician", name: "Electricians", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { id: "plumber", name: "Plumbers", icon: Wrench, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "carpenter", name: "Carpenters", icon: Hammer, color: "text-amber-600", bgColor: "bg-amber-600/10" },
  { id: "mechanic", name: "Mechanics", icon: Settings, color: "text-gray-500", bgColor: "bg-gray-500/10" },
  { id: "painter", name: "Painters", icon: Paintbrush, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "mason", name: "Masons", icon: Home, color: "text-orange-500", bgColor: "bg-orange-500/10" },
];

// Mock workers data
const mockWorkers: Worker[] = [
  { id: "1", name: "John Electrician", category: "electrician", specialty: "Residential Wiring", rating: 4.9, reviews: 156, hourlyRate: 45, experience: "12 years", available: true, skills: ["Wiring", "Panel Installation", "LED Lighting", "Smart Home"] },
  { id: "2", name: "Mike Sparks", category: "electrician", specialty: "Commercial Electrical", rating: 4.8, reviews: 89, hourlyRate: 55, experience: "8 years", available: true, skills: ["Commercial", "Industrial", "Emergency Repairs"] },
  { id: "3", name: "David Pipes", category: "plumber", specialty: "Emergency Repairs", rating: 4.7, reviews: 203, hourlyRate: 50, experience: "15 years", available: true, skills: ["Leak Repair", "Pipe Installation", "Drain Cleaning", "Water Heater"] },
  { id: "4", name: "Steve Flow", category: "plumber", specialty: "New Construction", rating: 4.6, reviews: 67, hourlyRate: 48, experience: "10 years", available: false, skills: ["New Installation", "Renovation", "Bathroom Fitting"] },
  { id: "5", name: "Tom Woodwork", category: "carpenter", specialty: "Custom Furniture", rating: 4.9, reviews: 134, hourlyRate: 40, experience: "20 years", available: true, skills: ["Furniture", "Cabinets", "Flooring", "Framing"] },
  { id: "6", name: "James Craft", category: "carpenter", specialty: "Home Renovations", rating: 4.5, reviews: 78, hourlyRate: 35, experience: "6 years", available: true, skills: ["Renovation", "Doors", "Windows", "Decking"] },
  { id: "7", name: "Robert Fix", category: "mechanic", specialty: "Auto Repair", rating: 4.8, reviews: 245, hourlyRate: 55, experience: "14 years", available: true, skills: ["Engine Repair", "Brake Service", "Transmission", "Diagnostics"] },
  { id: "8", name: "Mark Motors", category: "mechanic", specialty: "Diesel Engines", rating: 4.7, reviews: 112, hourlyRate: 60, experience: "11 years", available: true, skills: ["Diesel", "Heavy Duty", "Fleet Service"] },
  { id: "9", name: "Paul Colors", category: "painter", specialty: "Interior Painting", rating: 4.6, reviews: 189, hourlyRate: 35, experience: "9 years", available: true, skills: ["Interior", "Exterior", "Texture", "Wallpaper"] },
  { id: "10", name: "Chris Brush", category: "painter", specialty: "Commercial Projects", rating: 4.4, reviews: 56, hourlyRate: 40, experience: "7 years", available: false, skills: ["Commercial", "Industrial Coatings", "Spray Painting"] },
  { id: "11", name: "Daniel Stone", category: "mason", specialty: "Brick & Stone", rating: 4.9, reviews: 98, hourlyRate: 50, experience: "18 years", available: true, skills: ["Brickwork", "Stone Walls", "Concrete", "Paving"] },
  { id: "12", name: "Kevin Build", category: "mason", specialty: "Foundation Work", rating: 4.7, reviews: 67, hourlyRate: 55, experience: "13 years", available: true, skills: ["Foundation", "Retaining Walls", "Chimney Repair"] },
];

const BuildingServices = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingAddress, setBookingAddress] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const filteredWorkers = mockWorkers.filter(worker => {
    const matchesCategory = selectedCategory === "all" || worker.category === selectedCategory;
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to book a service");
      return;
    }

    if (!bookingDate || !bookingTime || !bookingDescription || !bookingAddress || !selectedWorker) {
      toast.error("Please fill in all booking details");
      return;
    }

    setIsBooking(true);
    try {
      await db
        .from('building_service_bookings')
        .insert({
          user_id: user.id,
          service_category: selectedWorker.category,
          worker_type: selectedWorker.specialty,
          description: bookingDescription,
          address: bookingAddress,
          scheduled_date: format(bookingDate, 'yyyy-MM-dd'),
          scheduled_time: bookingTime,
          estimated_cost: selectedWorker.hourlyRate * 2,
          notes: `Worker: ${selectedWorker.name}`
        });

      toast.success("Booking request submitted successfully!");
      setSelectedWorker(null);
      setBookingDate(undefined);
      setBookingTime("");
      setBookingDescription("");
      setBookingAddress("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Building Services
          </h1>
          <p className="text-white/90 max-w-xl mx-auto">
            Find skilled professionals for all your construction and repair needs
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers, skills, or services..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {workerCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {workerCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card 
                key={cat.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedCategory === cat.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? "all" : cat.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={cn("w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2", cat.bgColor)}>
                    <Icon className={cn("h-6 w-6", cat.color)} />
                  </div>
                  <p className="text-sm font-medium">{cat.name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Workers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => {
            const category = workerCategories.find(c => c.id === worker.category);
            const Icon = category?.icon || Wrench;
            
            return (
              <Card key={worker.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className={cn("text-lg", category?.bgColor, category?.color)}>
                        {worker.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{worker.name}</CardTitle>
                        <Badge variant={worker.available ? "default" : "secondary"}>
                          {worker.available ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {worker.specialty}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{worker.rating}</span>
                      <span className="text-muted-foreground">({worker.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {worker.experience}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {worker.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {worker.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{worker.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-lg font-bold text-primary">
                    ${worker.hourlyRate}/hr
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-3 flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        if (!user) {
                          toast.error("Please login to message workers");
                          return;
                        }
                        toast.success(`Starting chat with ${worker.name}`);
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        toast.info(`Calling ${worker.name}...`);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={!worker.available}
                        onClick={() => setSelectedWorker(worker)}
                      >
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book {worker.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Avatar>
                            <AvatarFallback>{worker.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-sm text-muted-foreground">{worker.specialty}</p>
                          </div>
                          <Badge className="ml-auto">${worker.hourlyRate}/hr</Badge>
                        </div>

                        <div className="space-y-2">
                          <Label>Service Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {bookingDate ? format(bookingDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={bookingDate}
                                onSelect={setBookingDate}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Preferred Time</Label>
                          <Select value={bookingTime} onValueChange={setBookingTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="08:00">8:00 AM</SelectItem>
                              <SelectItem value="09:00">9:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="14:00">2:00 PM</SelectItem>
                              <SelectItem value="15:00">3:00 PM</SelectItem>
                              <SelectItem value="16:00">4:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Service Address</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter your address"
                              className="pl-10"
                              value={bookingAddress}
                              onChange={(e) => setBookingAddress(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Describe the work needed</Label>
                          <Textarea
                            placeholder="Describe your project or issue in detail..."
                            value={bookingDescription}
                            onChange={(e) => setBookingDescription(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button onClick={handleBooking} disabled={isBooking} className="w-full">
                          {isBooking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Confirm Booking
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredWorkers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No workers found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuildingServices;
