import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { toast } from "@/hooks/use-toast";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Upload, Send, Loader2, CheckCircle } from "lucide-react";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  serviceType: z.string().min(1, "Please select a service type"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)").max(1000),
  budget: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  location: z.string().optional(),
  urgency: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface InlineBookingFormProps {
  serviceTypes: string[];
  title?: string;
  description?: string;
  category: string;
  onSuccess?: () => void;
}

const InlineBookingForm = ({ 
  serviceTypes, 
  title = "Submit Your Request",
  description = "Fill out the form below and our team will review your request within 24 hours",
  category,
  onSuccess
}: InlineBookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: user?.profile?.full_name || "",
      email: user?.email || "",
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - uploadedImages.length);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newFiles]);
      setImagePreview(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to submit a request",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create notification for the user
      await db.from("notifications").insert({
        user_id: user.id,
        title: "Booking Request Submitted",
        message: `Your ${data.serviceType} request has been submitted. Our team will review it within 24 hours.`,
        type: "booking",
      });

      setIsSubmitted(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "Our customer service team will review your request and get back to you within 24 hours.",
      });
      
      reset();
      setUploadedImages([]);
      setImagePreview([]);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">Request Submitted!</h3>
          <p className="text-green-700 mb-4">
            Thank you! Our team will review your request and contact you within 24 hours.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                {...register("name")} 
                placeholder="John Doe"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone" 
                {...register("phone")} 
                placeholder="+1 234 567 8900"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              type="email"
              {...register("email")} 
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select onValueChange={(value) => setValue("serviceType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType.message}</p>}
          </div>

          {/* Date, Time, Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input 
                id="preferredDate" 
                type="date"
                {...register("preferredDate")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input 
                id="preferredTime" 
                type="time"
                {...register("preferredTime")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select onValueChange={(value) => setValue("urgency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Within a week</SelectItem>
                  <SelectItem value="medium">Medium - Within 3 days</SelectItem>
                  <SelectItem value="high">High - Within 24 hours</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input 
                id="budget" 
                {...register("budget")} 
                placeholder="$500 - $1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                {...register("location")} 
                placeholder="City or address"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Describe Your Request *</Label>
            <Textarea 
              id="description" 
              {...register("description")} 
              placeholder="Please provide detailed information about what you need..."
              rows={4}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Images (Optional, max 5)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadedImages.length >= 5}
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadedImages.length >= 5 
                    ? "Maximum 5 images reached" 
                    : "Click to upload images or drag and drop"}
                </span>
              </label>
            </div>
            {imagePreview.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {imagePreview.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={img} 
                      alt={`Upload ${idx + 1}`} 
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InlineBookingForm;