export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  vendor: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  provider: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  price: number;
  duration: string;
  students: number;
}

export const categories = [
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "fashion", name: "Fashion", icon: "👕" },
  { id: "home", name: "Home & Garden", icon: "🏠" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "toys", name: "Toys & Games", icon: "🎮" },
  { id: "beauty", name: "Beauty", icon: "💄" },
  { id: "automotive", name: "Automotive", icon: "🚗" },
];

export const dealCategories = [
  { id: "booking", name: "Booking", icon: "📅" },
  { id: "tasks", name: "Task Center", icon: "✅" },
  { id: "transport", name: "Transportation", icon: "✈️" },
  { id: "hotels", name: "Hotels", icon: "🏨" },
  { id: "building", name: "Building", icon: "🏗️" },
  { id: "jobs", name: "Jobs", icon: "💼" },
  { id: "agriculture", name: "Agriculture", icon: "🌾" },
  { id: "food", name: "Food", icon: "🍔" },
];

export const learnCategories = [
  { id: "tech", name: "Technology", icon: "💻" },
  { id: "business", name: "Business", icon: "💼" },
  { id: "agriculture", name: "Agriculture", icon: "🌾" },
  { id: "mechanical", name: "Mechanical", icon: "🔧" },
  { id: "building", name: "Building", icon: "🏗️" },
  { id: "blockchain", name: "Blockchain", icon: "⛓️" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "marketing", name: "Marketing", icon: "📢" },
];

export const healthcareCategories = [
  { id: "doctors", name: "Doctors", icon: "👨‍⚕️" },
  { id: "dentists", name: "Dentists", icon: "🦷" },
  { id: "pharmacy", name: "Pharmacy", icon: "💊" },
  { id: "labs", name: "Laboratories", icon: "🔬" },
  { id: "therapy", name: "Therapy", icon: "🧘" },
  { id: "nutrition", name: "Nutrition", icon: "🥗" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    category: "Electronics",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    rating: 4.8,
    vendor: "TechWorld Store",
  },
  {
    id: "2",
    name: "Smart Watch Series 5",
    category: "Electronics",
    price: 399.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    rating: 4.9,
    vendor: "Gadget Hub",
  },
  {
    id: "3",
    name: "Designer Leather Jacket",
    category: "Fashion",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
    rating: 4.7,
    vendor: "Fashion Elite",
  },
  {
    id: "4",
    name: "Professional Camera Kit",
    category: "Electronics",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400",
    rating: 4.9,
    vendor: "Photo Pro",
  },
  {
    id: "5",
    name: "Ergonomic Office Chair",
    category: "Home & Garden",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400",
    rating: 4.6,
    vendor: "Office Comfort",
  },
  {
    id: "6",
    name: "Yoga Mat & Accessories Set",
    category: "Sports",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
    rating: 4.5,
    vendor: "Fitness Pro",
  },
];

export const services: Service[] = [
  {
    id: "s1",
    name: "Airport Shuttle Service",
    category: "Transportation",
    price: 45.00,
    description: "Reliable airport pickup and drop-off service",
    provider: "Swift Transport",
  },
  {
    id: "s2",
    name: "Hotel Booking - Luxury Suite",
    category: "Hotels",
    price: 250.00,
    description: "5-star hotel suite with city view",
    provider: "Premium Hotels Global",
  },
  {
    id: "s3",
    name: "Farm Equipment Rental",
    category: "Agriculture",
    price: 120.00,
    description: "Daily tractor and equipment rental",
    provider: "AgriTools Co",
  },
  {
    id: "s4",
    name: "Professional House Painting",
    category: "Building",
    price: 800.00,
    description: "Complete interior/exterior painting service",
    provider: "Master Painters",
  },
];

export const courses: Course[] = [
  {
    id: "c1",
    title: "Complete Web Development Bootcamp",
    category: "Technology",
    instructor: "John Smith",
    price: 99.99,
    duration: "40 hours",
    students: 12453,
  },
  {
    id: "c2",
    title: "Digital Marketing Mastery",
    category: "Marketing",
    instructor: "Sarah Johnson",
    price: 79.99,
    duration: "25 hours",
    students: 8932,
  },
  {
    id: "c3",
    title: "Modern Agriculture Techniques",
    category: "Agriculture",
    instructor: "David Green",
    price: 59.99,
    duration: "15 hours",
    students: 3421,
  },
  {
    id: "c4",
    title: "Blockchain Development",
    category: "Blockchain",
    instructor: "Michael Chen",
    price: 149.99,
    duration: "50 hours",
    students: 6782,
  },
];
