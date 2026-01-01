export interface Flight {
  id: string;
  from: string;
  to: string;
  airline: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  available: boolean;
}

export interface HotelListing {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  pricePerNight: number;
  image: string;
  amenities: string[];
  roomsAvailable: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  participants: number;
  maxParticipants: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  experience: string;
  posted: string;
  description: string;
}

export interface TransportOption {
  id: string;
  type: "Car" | "Motorcycle" | "Lorry" | "Bus" | "Boat";
  name: string;
  pricePerKm: number;
  capacity: number;
  image: string;
  available: boolean;
  rating: number;
}

export interface PropertyListing {
  id: string;
  type: "Land" | "House" | "Apartment" | "Commercial" | "Rent";
  title: string;
  location: string;
  price: number;
  size: string;
  image: string;
  features: string[];
}

export interface AgricultureService {
  id: string;
  type: "Equipment" | "Workers" | "Products" | "Consultation";
  name: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
}

export interface FoodItem {
  id: string;
  category: "Stock" | "Ready-made" | "Drinks" | "Snacks";
  name: string;
  price: number;
  description: string;
  image: string;
  deliveryTime: string;
  vendor: string;
}

// Mock Flights Data
export const flights: Flight[] = [
  {
    id: "f1",
    from: "New York (JFK)",
    to: "London (LHR)",
    airline: "British Airways",
    price: 850,
    departureTime: "10:00 AM",
    arrivalTime: "10:00 PM",
    duration: "7h 00m",
    stops: 0,
    available: true,
  },
  {
    id: "f2",
    from: "Los Angeles (LAX)",
    to: "Tokyo (NRT)",
    airline: "Japan Airlines",
    price: 1200,
    departureTime: "2:30 PM",
    arrivalTime: "6:30 PM +1",
    duration: "12h 00m",
    stops: 0,
    available: true,
  },
  {
    id: "f3",
    from: "Dubai (DXB)",
    to: "Paris (CDG)",
    airline: "Emirates",
    price: 680,
    departureTime: "8:00 AM",
    arrivalTime: "1:00 PM",
    duration: "7h 00m",
    stops: 0,
    available: true,
  },
  {
    id: "f4",
    from: "Singapore (SIN)",
    to: "Sydney (SYD)",
    airline: "Qantas",
    price: 550,
    departureTime: "11:30 PM",
    arrivalTime: "9:30 AM +1",
    duration: "8h 00m",
    stops: 0,
    available: true,
  },
  {
    id: "f5",
    from: "Lagos (LOS)",
    to: "Johannesburg (JNB)",
    airline: "South African Airways",
    price: 420,
    departureTime: "6:00 AM",
    arrivalTime: "12:00 PM",
    duration: "6h 00m",
    stops: 1,
    available: true,
  },
];

// Mock Hotels Data
export const hotels: HotelListing[] = [
  {
    id: "h1",
    name: "Grand Plaza Hotel",
    city: "New York",
    country: "USA",
    rating: 4.8,
    pricePerNight: 299,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    roomsAvailable: 12,
  },
  {
    id: "h2",
    name: "Sakura Garden Resort",
    city: "Tokyo",
    country: "Japan",
    rating: 4.9,
    pricePerNight: 450,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    amenities: ["WiFi", "Onsen", "Restaurant", "Garden", "Tea Ceremony"],
    roomsAvailable: 5,
  },
  {
    id: "h3",
    name: "Desert Oasis Palace",
    city: "Dubai",
    country: "UAE",
    rating: 4.7,
    pricePerNight: 580,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
    amenities: ["WiFi", "Private Beach", "Spa", "Butler", "Infinity Pool"],
    roomsAvailable: 8,
  },
  {
    id: "h4",
    name: "Parisian Elegance",
    city: "Paris",
    country: "France",
    rating: 4.6,
    pricePerNight: 380,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    amenities: ["WiFi", "Restaurant", "Bar", "Concierge", "Room Service"],
    roomsAvailable: 15,
  },
  {
    id: "h5",
    name: "African Safari Lodge",
    city: "Nairobi",
    country: "Kenya",
    rating: 4.9,
    pricePerNight: 320,
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400",
    amenities: ["WiFi", "Safari Tours", "Pool", "Restaurant", "Wildlife"],
    roomsAvailable: 6,
  },
];

// Mock Tasks Data
export const tasks: Task[] = [
  {
    id: "t1",
    title: "Social Media Product Review",
    description: "Write and post a genuine review of our product on your social media",
    reward: 25,
    deadline: "2026-01-15",
    participants: 45,
    maxParticipants: 100,
    category: "Marketing",
    difficulty: "Easy",
  },
  {
    id: "t2",
    title: "App Testing & Bug Report",
    description: "Test our mobile app and submit detailed bug reports",
    reward: 75,
    deadline: "2026-01-10",
    participants: 12,
    maxParticipants: 25,
    category: "Technology",
    difficulty: "Medium",
  },
  {
    id: "t3",
    title: "Content Translation (English to Spanish)",
    description: "Translate 5 blog articles from English to Spanish",
    reward: 150,
    deadline: "2026-01-20",
    participants: 3,
    maxParticipants: 5,
    category: "Translation",
    difficulty: "Hard",
  },
  {
    id: "t4",
    title: "Survey Completion",
    description: "Complete a 15-minute survey about shopping habits",
    reward: 10,
    deadline: "2026-01-08",
    participants: 234,
    maxParticipants: 500,
    category: "Research",
    difficulty: "Easy",
  },
  {
    id: "t5",
    title: "Video Testimonial",
    description: "Record a 2-minute video testimonial about your experience",
    reward: 50,
    deadline: "2026-01-25",
    participants: 8,
    maxParticipants: 20,
    category: "Marketing",
    difficulty: "Medium",
  },
];

// Mock Jobs Data
export const jobs: JobListing[] = [
  {
    id: "j1",
    title: "Senior Software Developer",
    company: "TechCorp Global",
    location: "San Francisco, CA",
    salary: "$120,000 - $160,000",
    type: "Full-time",
    experience: "5+ years",
    posted: "2 days ago",
    description: "Looking for an experienced developer proficient in React, Node.js, and cloud technologies.",
  },
  {
    id: "j2",
    title: "Digital Marketing Manager",
    company: "Brand Boost Agency",
    location: "Remote",
    salary: "$70,000 - $90,000",
    type: "Remote",
    experience: "3+ years",
    posted: "1 week ago",
    description: "Lead our digital marketing efforts across multiple channels and manage a small team.",
  },
  {
    id: "j3",
    title: "Farm Operations Manager",
    company: "Green Valley Farms",
    location: "Iowa, USA",
    salary: "$55,000 - $70,000",
    type: "Full-time",
    experience: "4+ years",
    posted: "3 days ago",
    description: "Oversee daily farm operations including crop management, equipment maintenance, and staff supervision.",
  },
  {
    id: "j4",
    title: "Part-time Delivery Driver",
    company: "Quick Deliver",
    location: "Multiple Locations",
    salary: "$18 - $25/hour",
    type: "Part-time",
    experience: "No experience required",
    posted: "Today",
    description: "Flexible hours, own vehicle required. Perfect for students or as a side gig.",
  },
  {
    id: "j5",
    title: "Construction Site Supervisor",
    company: "BuildRight Construction",
    location: "Houston, TX",
    salary: "$65,000 - $85,000",
    type: "Contract",
    experience: "7+ years",
    posted: "5 days ago",
    description: "Supervise construction projects, ensure safety compliance, and coordinate with contractors.",
  },
];

// Mock Transport Options
export const transportOptions: TransportOption[] = [
  {
    id: "tr1",
    type: "Car",
    name: "Economy Sedan",
    pricePerKm: 0.5,
    capacity: 4,
    image: "https://images.unsplash.com/photo-1449130441080-6e1ea90f9f31?w=400",
    available: true,
    rating: 4.5,
  },
  {
    id: "tr2",
    type: "Car",
    name: "Premium SUV",
    pricePerKm: 0.85,
    capacity: 6,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400",
    available: true,
    rating: 4.8,
  },
  {
    id: "tr3",
    type: "Motorcycle",
    name: "Quick Bike",
    pricePerKm: 0.25,
    capacity: 1,
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400",
    available: true,
    rating: 4.6,
  },
  {
    id: "tr4",
    type: "Lorry",
    name: "Cargo Truck",
    pricePerKm: 1.5,
    capacity: 20,
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400",
    available: true,
    rating: 4.3,
  },
  {
    id: "tr5",
    type: "Bus",
    name: "Luxury Coach",
    pricePerKm: 0.35,
    capacity: 45,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400",
    available: true,
    rating: 4.4,
  },
];

// Mock Properties
export const properties: PropertyListing[] = [
  {
    id: "p1",
    type: "House",
    title: "Modern Family Home",
    location: "Beverly Hills, CA",
    price: 1200000,
    size: "3,500 sq ft",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400",
    features: ["5 Bedrooms", "Pool", "Garage", "Garden", "Smart Home"],
  },
  {
    id: "p2",
    type: "Apartment",
    title: "Downtown Luxury Loft",
    location: "Manhattan, NY",
    price: 850000,
    size: "1,800 sq ft",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    features: ["2 Bedrooms", "City View", "Gym Access", "Doorman"],
  },
  {
    id: "p3",
    type: "Land",
    title: "Agricultural Land",
    location: "Texas Countryside",
    price: 250000,
    size: "50 acres",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
    features: ["Fertile Soil", "Water Access", "Road Access", "Fenced"],
  },
  {
    id: "p4",
    type: "Rent",
    title: "Cozy Studio Apartment",
    location: "Chicago, IL",
    price: 1500,
    size: "600 sq ft",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    features: ["Furnished", "Utilities Included", "Pets Allowed"],
  },
  {
    id: "p5",
    type: "Commercial",
    title: "Retail Space",
    location: "Miami Beach, FL",
    price: 5500,
    size: "2,000 sq ft",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    features: ["High Traffic", "Parking", "Street Front", "AC"],
  },
];

// Mock Agriculture Services
export const agricultureServices: AgricultureService[] = [
  {
    id: "ag1",
    type: "Equipment",
    name: "Tractor Rental - John Deere",
    price: 150,
    description: "Daily rental of modern John Deere tractor with attachments",
    image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400",
    available: true,
  },
  {
    id: "ag2",
    type: "Workers",
    name: "Farm Labor Team (5 workers)",
    price: 200,
    description: "Experienced farm workers for planting, harvesting, or maintenance",
    image: "https://images.unsplash.com/photo-1589923188651-268a9765e432?w=400",
    available: true,
  },
  {
    id: "ag3",
    type: "Products",
    name: "Organic Fertilizer (50kg)",
    price: 45,
    description: "High-quality organic fertilizer for all crop types",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    available: true,
  },
  {
    id: "ag4",
    type: "Consultation",
    name: "Crop Management Consultation",
    price: 100,
    description: "Expert advice on crop selection, pest control, and yield optimization",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400",
    available: true,
  },
];

// Mock Food Items
export const foodItems: FoodItem[] = [
  {
    id: "fd1",
    category: "Stock",
    name: "Premium Rice (50kg bag)",
    price: 85,
    description: "High-quality long grain rice for household or restaurant use",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    deliveryTime: "2-3 days",
    vendor: "Farm Fresh Supplies",
  },
  {
    id: "fd2",
    category: "Ready-made",
    name: "Grilled Chicken Platter",
    price: 18,
    description: "Juicy grilled chicken with sides and fresh salad",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
    deliveryTime: "30-45 mins",
    vendor: "Grill Master Kitchen",
  },
  {
    id: "fd3",
    category: "Drinks",
    name: "Fresh Orange Juice (1L)",
    price: 6,
    description: "Freshly squeezed orange juice with no additives",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400",
    deliveryTime: "1-2 hours",
    vendor: "Juice Bar Express",
  },
  {
    id: "fd4",
    category: "Stock",
    name: "Cooking Oil (25L)",
    price: 42,
    description: "Premium vegetable cooking oil for all your cooking needs",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
    deliveryTime: "2-3 days",
    vendor: "Kitchen Essentials Co",
  },
  {
    id: "fd5",
    category: "Ready-made",
    name: "Beef Burger Combo",
    price: 14,
    description: "Classic beef burger with fries and drink",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    deliveryTime: "25-35 mins",
    vendor: "Burger Palace",
  },
];
