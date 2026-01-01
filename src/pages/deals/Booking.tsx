import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BookingRequestForm from "@/components/booking/BookingRequestForm";
import { ArrowLeft, FileText, Upload, MessageCircle, CheckCircle } from "lucide-react";

const Booking = () => {
  const bookingSteps = [
    {
      icon: FileText,
      title: "Fill Out the Form",
      description: "Complete the booking request form with all necessary details about your requirements.",
    },
    {
      icon: Upload,
      title: "Upload Images",
      description: "Add relevant images to help our team understand your request better.",
    },
    {
      icon: MessageCircle,
      title: "Customer Service Review",
      description: "Our team reviews your request and responds with available options and pricing.",
    },
    {
      icon: CheckCircle,
      title: "Confirm & Pay",
      description: "Choose your preferred option, make payment, and we'll handle the rest.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Booking Services</h1>
          <p className="text-white/90">Submit your request and let us find the best options for you</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {bookingSteps.map((step, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mt-4 mb-4">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Booking Form Section */}
        <Card className="p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Start Your Booking Request</h2>
            <p className="text-muted-foreground">
              Choose your service category and fill out the form. Our customer service team will 
              review your request and get back to you within 24 hours with available options.
            </p>
          </div>

          <div className="flex justify-center">
            <BookingRequestForm 
              serviceTypes={[
                "Product Request",
                "Service Booking",
                "Custom Order",
                "Bulk Purchase",
                "Special Event",
                "Consultation",
                "Other"
              ]}
              title="Submit Booking Request"
              description="Tell us what you need and we'll find the best options for you."
            />
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-bold mb-4 text-center">Quick Access to Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/deals/transportation">
                <Button variant="outline" className="w-full">Transportation</Button>
              </Link>
              <Link to="/deals/hotels">
                <Button variant="outline" className="w-full">Hotels</Button>
              </Link>
              <Link to="/deals/jobs">
                <Button variant="outline" className="w-full">Jobs</Button>
              </Link>
              <Link to="/deals/agriculture">
                <Button variant="outline" className="w-full">Agriculture</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
