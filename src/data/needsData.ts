export interface NeedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  provider: string;
  image?: string;
  tags: string[];
}

export interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  items: NeedItem[];
}

// Generate comprehensive data for each need category
const generateItems = (category: string, count: number): NeedItem[] => {
  const itemTemplates: Record<string, { names: string[], descriptions: string[], providers: string[], tags: string[][] }> = {
    transportation: {
      names: ['Airport Shuttle', 'City Taxi', 'Car Rental', 'Bus Ticket', 'Train Pass', 'Bike Rental', 'Motorcycle Taxi', 'Private Chauffeur', 'Limousine Service', 'Cargo Transport'],
      descriptions: ['Reliable and affordable transportation', 'Fast and comfortable travel', 'Premium service with experienced drivers', 'Budget-friendly options available', 'Door-to-door service'],
      providers: ['Swift Transport', 'City Movers', 'Premium Rides', 'EcoTransit', 'FastTrack'],
      tags: [['fast', 'reliable'], ['affordable', 'convenient'], ['premium', 'luxury'], ['eco-friendly', 'budget']]
    },
    hotels: {
      names: ['Luxury Suite', 'Business Hotel', 'Budget Inn', 'Resort Stay', 'Boutique Hotel', 'Beach Villa', 'Mountain Lodge', 'City Apartment', 'Hostel Room', 'Eco Lodge'],
      descriptions: ['5-star accommodation', 'Modern amenities included', 'Perfect for travelers', 'Scenic views and comfort', 'Central location'],
      providers: ['Grand Hotels', 'Comfort Stays', 'Premier Lodging', 'Traveler\'s Choice', 'Urban Suites'],
      tags: [['luxury', '5-star'], ['business', 'wifi'], ['budget', 'clean'], ['scenic', 'peaceful']]
    },
    jobs: {
      names: ['Software Developer', 'Marketing Manager', 'Sales Executive', 'Graphic Designer', 'Accountant', 'Customer Service Rep', 'Project Manager', 'Data Analyst', 'HR Specialist', 'Content Writer'],
      descriptions: ['Full-time position', 'Remote work available', 'Competitive salary', 'Growth opportunities', 'Benefits included'],
      providers: ['TechCorp', 'Global Solutions', 'Innovation Labs', 'Enterprise Co', 'StartupHub'],
      tags: [['full-time', 'remote'], ['on-site', 'benefits'], ['contract', 'flexible'], ['entry-level', 'experienced']]
    },
    housing: {
      names: ['Modern Apartment', 'Family House', 'Studio Flat', 'Penthouse', 'Townhouse', 'Cottage', 'Loft Space', 'Duplex', 'Villa', 'Condo'],
      descriptions: ['Spacious and modern', 'Prime location', 'Fully furnished', 'Pet-friendly', 'Parking included'],
      providers: ['Premium Realty', 'Home Finders', 'City Estates', 'Dream Properties', 'Safe Homes'],
      tags: [['furnished', 'modern'], ['family', 'spacious'], ['budget', 'cozy'], ['luxury', 'view']]
    },
    food: {
      names: ['Gourmet Dining', 'Fast Food', 'Home Delivery', 'Catering Service', 'Meal Prep', 'Restaurant Booking', 'Food Truck', 'Fine Dining', 'Buffet', 'Street Food'],
      descriptions: ['Delicious and fresh', 'Quick service', 'Wide variety', 'Quality ingredients', 'Affordable prices'],
      providers: ['Tasty Bites', 'Quick Eats', 'Gourmet Plus', 'Food Express', 'Chef\'s Choice'],
      tags: [['fast', 'delivery'], ['gourmet', 'fine'], ['healthy', 'organic'], ['budget', 'quick']]
    },
    education: {
      names: ['Online Course', 'Tutoring', 'Workshop', 'Certification', 'Language Class', 'Skill Training', 'Degree Program', 'Bootcamp', 'Mentorship', 'Seminar'],
      descriptions: ['Expert instructors', 'Flexible schedule', 'Certificate provided', 'Hands-on learning', 'Career focused'],
      providers: ['EduPro', 'Learn Now', 'Skill Academy', 'Career Plus', 'Knowledge Hub'],
      tags: [['online', 'flexible'], ['certified', 'professional'], ['beginner', 'advanced'], ['career', 'skills']]
    },
    healthcare: {
      names: ['General Checkup', 'Specialist Consultation', 'Lab Test', 'Dental Care', 'Eye Exam', 'Physical Therapy', 'Mental Health', 'Home Care', 'Emergency', 'Vaccination'],
      descriptions: ['Professional healthcare', 'Modern equipment', 'Experienced doctors', 'Affordable plans', '24/7 availability'],
      providers: ['HealthFirst', 'Care Plus', 'Medical Center', 'Wellness Clinic', 'Life Care'],
      tags: [['checkup', 'routine'], ['specialist', 'expert'], ['emergency', '24/7'], ['affordable', 'insurance']]
    },
    legal: {
      names: ['Legal Consultation', 'Contract Review', 'Business Registration', 'Property Law', 'Family Law', 'Criminal Defense', 'Immigration', 'Tax Advisory', 'Dispute Resolution', 'Notary Service'],
      descriptions: ['Expert legal advice', 'Confidential service', 'Affordable rates', 'Experienced attorneys', 'Quick resolution'],
      providers: ['Law Partners', 'Legal Eagles', 'Justice Firm', 'Rights Advocates', 'Legal Solutions'],
      tags: [['consultation', 'advice'], ['business', 'corporate'], ['family', 'personal'], ['urgent', 'affordable']]
    },
    finance: {
      names: ['Personal Loan', 'Business Financing', 'Investment Advisory', 'Insurance', 'Tax Filing', 'Mortgage', 'Savings Plan', 'Retirement Planning', 'Crypto Trading', 'Money Transfer'],
      descriptions: ['Low interest rates', 'Quick approval', 'Expert advisors', 'Secure transactions', 'Flexible terms'],
      providers: ['FinanceFirst', 'Money Wise', 'Capital Plus', 'Secure Bank', 'Wealth Builders'],
      tags: [['loan', 'quick'], ['investment', 'growth'], ['insurance', 'secure'], ['savings', 'retirement']]
    },
    technology: {
      names: ['Web Development', 'App Development', 'IT Support', 'Cloud Services', 'Cybersecurity', 'Data Analytics', 'AI Solutions', 'Network Setup', 'Software License', 'Tech Consulting'],
      descriptions: ['Cutting-edge solutions', 'Expert developers', '24/7 support', 'Scalable services', 'Competitive pricing'],
      providers: ['TechPro', 'Digital Solutions', 'Code Masters', 'IT Experts', 'Innovation Tech'],
      tags: [['development', 'custom'], ['support', '24/7'], ['cloud', 'secure'], ['ai', 'modern']]
    },
    beauty: {
      names: ['Hair Salon', 'Spa Treatment', 'Makeup Service', 'Nail Art', 'Skincare', 'Massage', 'Hair Removal', 'Facial', 'Body Treatment', 'Bridal Makeup'],
      descriptions: ['Premium products', 'Expert stylists', 'Relaxing atmosphere', 'Latest trends', 'Personalized service'],
      providers: ['Glow Beauty', 'Style Studio', 'Zen Spa', 'Beauty Plus', 'Glamour House'],
      tags: [['premium', 'luxury'], ['relaxing', 'spa'], ['quick', 'affordable'], ['bridal', 'special']]
    },
    fitness: {
      names: ['Gym Membership', 'Personal Training', 'Yoga Class', 'Swimming', 'Martial Arts', 'Dance Class', 'CrossFit', 'Pilates', 'Outdoor Boot Camp', 'Sports Training'],
      descriptions: ['State-of-the-art equipment', 'Certified trainers', 'Flexible schedules', 'All fitness levels', 'Group classes available'],
      providers: ['FitLife', 'Power Gym', 'Zen Fitness', 'Active Club', 'Strength Zone'],
      tags: [['gym', 'equipment'], ['personal', 'trainer'], ['group', 'class'], ['beginner', 'advanced']]
    },
    pets: {
      names: ['Pet Grooming', 'Veterinary Care', 'Pet Sitting', 'Dog Walking', 'Pet Training', 'Pet Supplies', 'Pet Adoption', 'Pet Insurance', 'Pet Hotel', 'Pet Photography'],
      descriptions: ['Loving care for pets', 'Professional services', 'Experienced handlers', 'Safe environment', 'All breeds welcome'],
      providers: ['Pet Paradise', 'Happy Paws', 'Pet Care Plus', 'Animal Friends', 'Pet Lovers'],
      tags: [['grooming', 'care'], ['vet', 'medical'], ['training', 'behavior'], ['boarding', 'sitting']]
    },
    events: {
      names: ['Wedding Planning', 'Corporate Events', 'Birthday Party', 'Concert Tickets', 'Conference', 'Festival', 'Exhibition', 'Sports Event', 'Networking Event', 'Private Party'],
      descriptions: ['Full event management', 'Creative planning', 'Budget-friendly options', 'Premium services', 'Memorable experiences'],
      providers: ['Event Masters', 'Celebrate Co', 'Party Pro', 'Event Plus', 'Dream Events'],
      tags: [['wedding', 'special'], ['corporate', 'business'], ['party', 'fun'], ['tickets', 'venue']]
    },
    cleaning: {
      names: ['House Cleaning', 'Office Cleaning', 'Deep Clean', 'Carpet Cleaning', 'Window Washing', 'Laundry Service', 'Disinfection', 'Move-out Clean', 'Pool Cleaning', 'Pressure Washing'],
      descriptions: ['Professional cleaners', 'Eco-friendly products', 'Flexible scheduling', 'Satisfaction guaranteed', 'Affordable rates'],
      providers: ['Clean Pro', 'Sparkle Services', 'Fresh Home', 'Tidy Team', 'Pure Clean'],
      tags: [['home', 'residential'], ['office', 'commercial'], ['deep', 'thorough'], ['eco', 'green']]
    }
  };

  const template = itemTemplates[category] || itemTemplates['transportation'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${category}-${i + 1}`,
    name: `${template.names[i % template.names.length]} ${Math.floor(i / template.names.length) > 0 ? `#${Math.floor(i / template.names.length) + 1}` : ''}`.trim(),
    description: template.descriptions[i % template.descriptions.length],
    price: Math.floor(Math.random() * 500) + 20,
    rating: Number((4 + Math.random()).toFixed(1)),
    provider: template.providers[i % template.providers.length],
    tags: template.tags[i % template.tags.length]
  }));
};

export const needsCategoryData: Record<string, NeedItem[]> = {
  transportation: generateItems('transportation', 50),
  hotels: generateItems('hotels', 50),
  jobs: generateItems('jobs', 50),
  housing: generateItems('housing', 50),
  food: generateItems('food', 50),
  education: generateItems('education', 50),
  healthcare: generateItems('healthcare', 50),
  legal: generateItems('legal', 50),
  finance: generateItems('finance', 50),
  technology: generateItems('technology', 50),
  beauty: generateItems('beauty', 50),
  fitness: generateItems('fitness', 50),
  pets: generateItems('pets', 50),
  events: generateItems('events', 50),
  cleaning: generateItems('cleaning', 50),
};

export const getAllNeedsData = (categorySlug: string): NeedItem[] => {
  return needsCategoryData[categorySlug] || generateItems(categorySlug, 50);
};
