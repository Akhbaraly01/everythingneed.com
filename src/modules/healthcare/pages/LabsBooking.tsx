import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, TestTube2, Microscope, Heart, Activity, 
  Droplets, Brain, Bone, Eye, Search, Clock, MapPin,
  CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@core/api/supabaseGateway";

interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  fasting: boolean;
  icon: React.ReactNode;
}

const labTests: LabTest[] = [
  { id: "cbc", name: "Complete Blood Count (CBC)", category: "Blood", price: 25, duration: "1-2 hours", description: "Measures red/white blood cells, hemoglobin, platelets", fasting: false, icon: <Droplets className="h-5 w-5" /> },
  { id: "lft", name: "Liver Function Test", category: "Blood", price: 45, duration: "2-3 hours", description: "Evaluates liver health and function", fasting: true, icon: <Activity className="h-5 w-5" /> },
  { id: "kft", name: "Kidney Function Test", category: "Blood", price: 40, duration: "2-3 hours", description: "Assesses kidney health and function", fasting: false, icon: <Heart className="h-5 w-5" /> },
  { id: "lipid", name: "Lipid Profile", category: "Blood", price: 35, duration: "2-3 hours", description: "Measures cholesterol and triglycerides", fasting: true, icon: <Heart className="h-5 w-5" /> },
  { id: "thyroid", name: "Thyroid Panel", category: "Hormone", price: 55, duration: "3-4 hours", description: "TSH, T3, T4 levels", fasting: false, icon: <Activity className="h-5 w-5" /> },
  { id: "diabetes", name: "Diabetes Panel", category: "Blood", price: 50, duration: "2-3 hours", description: "Fasting glucose, HbA1c", fasting: true, icon: <Droplets className="h-5 w-5" /> },
  { id: "vitamin", name: "Vitamin D & B12", category: "Vitamin", price: 60, duration: "4-6 hours", description: "Essential vitamin levels", fasting: false, icon: <Brain className="h-5 w-5" /> },
  { id: "urine", name: "Urinalysis", category: "Urine", price: 20, duration: "1 hour", description: "Complete urine examination", fasting: false, icon: <TestTube2 className="h-5 w-5" /> },
  { id: "xray", name: "X-Ray (Chest)", category: "Imaging", price: 80, duration: "30 min", description: "Chest X-ray imaging", fasting: false, icon: <Bone className="h-5 w-5" /> },
  { id: "ultrasound", name: "Ultrasound (Abdominal)", category: "Imaging", price: 120, duration: "45 min", description: "Abdominal ultrasound scan", fasting: true, icon: <Microscope className="h-5 w-5" /> },
  { id: "ecg", name: "ECG/EKG", category: "Cardiac", price: 35, duration: "15 min", description: "Heart rhythm and electrical activity", fasting: false, icon: <Heart className="h-5 w-5" /> },
  { id: "eye", name: "Eye Examination", category: "Vision", price: 40, duration: "30 min", description: "Complete vision test", fasting: false, icon: <Eye className="h-5 w-5" /> },
];

const timeSlots = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const LabsBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [collectionType, setCollectionType] = useState("center");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["all", ...new Set(labTests.map(t => t.category))];

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectedTestDetails = labTests.filter(t => selectedTests.includes(t.id));
  const totalPrice = selectedTestDetails.reduce((sum, t) => sum + t.price, 0);
  const hasFastingTests = selectedTestDetails.some(t => t.fasting);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to book lab tests");
      navigate("/auth");
      return;
    }

    if (selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    if (collectionType === "home" && !address.trim()) {
      toast.error("Please enter your address for home collection");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const { error } = await supabase.from("health_tickets").insert({
        patient_id: user.id,
        ticket_number: ticketNumber,
        symptoms: selectedTestDetails.map(t => t.name).join(", "),
        description: `Lab Tests Booking - ${collectionType === "home" ? "Home Collection" : "Lab Visit"}. ${notes}`,
        appointment_date: selectedDate.toISOString().split("T")[0],
        appointment_time: selectedTime,
        status: "pending",
        is_random_assignment: true,
      });

      if (error) throw error;

      toast.success("Lab tests booked successfully!");
      navigate("/healthcare/tickets");
    } catch (error) {
      console.error("Error booking lab tests:", error);
      toast.error("Failed to book lab tests. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/healthcare">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Labs & Diagnostics</h1>
              <p className="text-white/80">Book lab tests with home collection option</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat === "all" ? "All Categories" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Test List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTests.map(test => (
                <Card 
                  key={test.id}
                  className={`cursor-pointer transition-all ${
                    selectedTests.includes(test.id) 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleTest(test.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        selectedTests.includes(test.id) ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        {test.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{test.name}</h3>
                          <Checkbox 
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={() => toggleTest(test.id)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">{test.category}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {test.duration}
                          </span>
                          {test.fasting && (
                            <Badge variant="secondary" className="text-xs">Fasting Required</Badge>
                          )}
                        </div>
                        <p className="font-bold text-primary mt-2">{formatPrice(test.price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Date & Time Selection */}
            {selectedTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Your Tests</CardTitle>
                  <CardDescription>Select preferred date and time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Select Date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">Select Time</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(slot => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(slot)}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Collection Type</Label>
                        <Select value={collectionType} onValueChange={setCollectionType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Visit Lab Center</SelectItem>
                            <SelectItem value="home">Home Collection (+$10)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {collectionType === "home" && (
                        <div>
                          <Label className="mb-2 block">Address for Home Collection</Label>
                          <Textarea
                            placeholder="Enter your complete address..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <Label className="mb-2 block">Additional Notes</Label>
                        <Textarea
                          placeholder="Any special requirements or medical conditions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{selectedTests.length} tests selected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTestDetails.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Select tests to proceed
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {selectedTestDetails.map(test => (
                        <div key={test.id} className="flex justify-between text-sm">
                          <span className="truncate mr-2">{test.name}</span>
                          <span className="font-medium shrink-0">{formatPrice(test.price)}</span>
                        </div>
                      ))}
                      {collectionType === "home" && (
                        <div className="flex justify-between text-sm">
                          <span>Home Collection Fee</span>
                          <span className="font-medium">{formatPrice(10)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatPrice(totalPrice + (collectionType === "home" ? 10 : 0))}
                        </span>
                      </div>
                    </div>

                    {hasFastingTests && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-orange-700 dark:text-orange-400">Fasting Required</p>
                            <p className="text-orange-600 dark:text-orange-300">
                              Some tests require 8-12 hours of fasting before sample collection.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleSubmit}
                      disabled={!selectedDate || !selectedTime || isSubmitting}
                    >
                      {isSubmitting ? "Booking..." : "Book Lab Tests"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabsBooking;
