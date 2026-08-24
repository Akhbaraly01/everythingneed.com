import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, Send } from "lucide-react";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  serviceType: z.string().min(1, "Please select a service type"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)").max(1000),
  budget: z.string().optional(),
  preferredDate: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingRequestFormProps {
  serviceTypes: string[];
  title?: string;
  description?: string;
}

const BookingRequestForm = ({ 
  serviceTypes, 
  title = "Submit Booking Request",
  description = "Fill out the form below and our customer service team will review your request"
}: BookingRequestFormProps) => {
  const [open, setOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const onSubmit = (data: BookingFormData) => {
    // Here you would send to backend
    console.log("Booking request:", { ...data, images: uploadedImages });
    toast({
      title: "Request Submitted!",
      description: "Our customer service team will review your request and get back to you within 24 hours.",
    });
    reset();
    setUploadedImages([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Submit Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input 
                id="budget" 
                {...register("budget")} 
                placeholder="$500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input 
                id="preferredDate" 
                type="date"
                {...register("preferredDate")} 
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label>Upload Images (Optional, max 5)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload images</span>
              </label>
            </div>
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {uploadedImages.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`Upload ${idx + 1}`} 
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Submit Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestForm;
