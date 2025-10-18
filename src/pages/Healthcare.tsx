import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryGrid from "@/components/CategoryGrid";
import { healthcareCategories } from "@/data/mockData";
import { Video, MapPin, Pill, Stethoscope, Calendar, Phone } from "lucide-react";

const Healthcare = () => {
  const healthServices = [
    {
      icon: Stethoscope,
      title: "Physical Consultation",
      description: "Book in-person appointments with healthcare professionals",
      price: "$50 - $200",
    },
    {
      icon: Video,
      title: "Virtual Consultation",
      description: "Connect with doctors via video call from anywhere",
      price: "$30 - $100",
    },
    {
      icon: Pill,
      title: "Pharmacy Delivery",
      description: "Order medicines online with doorstep delivery",
      price: "Varies",
    },
    {
      icon: MapPin,
      title: "Laboratory Tests",
      description: "Book lab tests and get results digitally",
      price: "$20 - $300",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-success to-success/70 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Healthcare Services
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Access doctors, dentists, pharmacies, and healthcare professionals - both physical and virtual
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Access Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Healthcare Categories</h2>
          <CategoryGrid categories={healthcareCategories} />
        </section>

        {/* Service Options */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {healthServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Starting from {service.price}</p>
                  <Button className="w-full" variant="outline">Book Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Consultation Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-success/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6 text-success" />
                  <CardTitle>Physical Consultation</CardTitle>
                </div>
                <CardDescription>Meet healthcare professionals in person</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">1.</span>
                    <span>Fill out the contact form with your details and symptoms</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">2.</span>
                    <span>Choose your preferred healthcare professional</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">3.</span>
                    <span>See the required amount and book your appointment</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">4.</span>
                    <span>Visit the clinic at your scheduled time</span>
                  </li>
                </ol>
                <Button className="w-full mt-6">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Physical Appointment
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Video className="h-6 w-6 text-primary" />
                  <CardTitle>Virtual Consultation</CardTitle>
                </div>
                <CardDescription>Connect with doctors remotely via video call</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">1.</span>
                    <span>Fill out the form with your health concerns</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">2.</span>
                    <span>Our team reviews and assigns appropriate specialist</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">3.</span>
                    <span>Make payment to confirm your consultation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold min-w-[24px]">4.</span>
                    <span>Connect via video call at scheduled time</span>
                  </li>
                </ol>
                <Button className="w-full mt-6">
                  <Phone className="h-4 w-4 mr-2" />
                  Start Virtual Consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pharmacy Section */}
        <section>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Online Pharmacy</h2>
                <p className="text-muted-foreground mb-4">
                  Browse thousands of medicines, supplements, and healthcare products. Upload prescriptions or request specific medicines through our form.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>✓ Wide range of medicines with detailed descriptions</li>
                  <li>✓ Upload prescription images for verification</li>
                  <li>✓ Contact customer service for special requests</li>
                  <li>✓ Fast delivery to your doorstep</li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Button size="lg">
                  <Pill className="h-5 w-5 mr-2" />
                  Browse Pharmacy
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Healthcare;
