export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  price: number;
  duration: string;
  students: number;
  rating: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: number;
  description: string;
  thumbnail?: string;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  duration: string;
  views: number;
  thumbnail: string;
  instructor: string;
  description: string;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  type: 'PDF' | 'Article' | 'Guide' | 'Ebook';
  pages: number;
  author: string;
  description: string;
  downloadCount: number;
}

export const extendedCourses: Course[] = [
  // Technology
  { id: 'c1', title: 'Complete Web Development Bootcamp', category: 'Technology', instructor: 'John Smith', price: 99.99, duration: '40 hours', students: 12453, rating: 4.9, level: 'Beginner', lessons: 120, description: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch' },
  { id: 'c2', title: 'Python for Data Science', category: 'Technology', instructor: 'Emily Chen', price: 89.99, duration: '35 hours', students: 9876, rating: 4.8, level: 'Intermediate', lessons: 85, description: 'Learn Python programming for data analysis and machine learning' },
  { id: 'c3', title: 'Mobile App Development with React Native', category: 'Technology', instructor: 'David Lee', price: 129.99, duration: '50 hours', students: 7654, rating: 4.7, level: 'Intermediate', lessons: 95, description: 'Build cross-platform mobile apps for iOS and Android' },
  { id: 'c4', title: 'Cloud Computing with AWS', category: 'Technology', instructor: 'Sarah Johnson', price: 149.99, duration: '45 hours', students: 6543, rating: 4.9, level: 'Advanced', lessons: 75, description: 'Master Amazon Web Services and cloud architecture' },
  { id: 'c5', title: 'Cybersecurity Fundamentals', category: 'Technology', instructor: 'Mike Wilson', price: 119.99, duration: '30 hours', students: 8765, rating: 4.8, level: 'Beginner', lessons: 60, description: 'Protect systems and networks from cyber threats' },
  
  // Business
  { id: 'c6', title: 'Business Strategy Masterclass', category: 'Business', instructor: 'Robert Brown', price: 79.99, duration: '25 hours', students: 5432, rating: 4.7, level: 'Intermediate', lessons: 45, description: 'Develop winning business strategies for growth' },
  { id: 'c7', title: 'Financial Management for Entrepreneurs', category: 'Business', instructor: 'Lisa Anderson', price: 89.99, duration: '20 hours', students: 4321, rating: 4.6, level: 'Beginner', lessons: 40, description: 'Manage finances and build profitable businesses' },
  { id: 'c8', title: 'Project Management Professional (PMP)', category: 'Business', instructor: 'James Taylor', price: 199.99, duration: '60 hours', students: 11234, rating: 4.9, level: 'Advanced', lessons: 110, description: 'Complete PMP certification preparation course' },
  
  // Marketing
  { id: 'c9', title: 'Digital Marketing Mastery', category: 'Marketing', instructor: 'Sarah Johnson', price: 79.99, duration: '25 hours', students: 8932, rating: 4.8, level: 'Beginner', lessons: 55, description: 'Master SEO, social media, and online advertising' },
  { id: 'c10', title: 'Content Marketing Strategy', category: 'Marketing', instructor: 'Emma White', price: 69.99, duration: '20 hours', students: 6789, rating: 4.7, level: 'Intermediate', lessons: 40, description: 'Create compelling content that drives engagement' },
  { id: 'c11', title: 'Social Media Marketing', category: 'Marketing', instructor: 'Alex Turner', price: 59.99, duration: '15 hours', students: 9876, rating: 4.6, level: 'Beginner', lessons: 35, description: 'Grow your brand on social platforms' },
  
  // Agriculture
  { id: 'c12', title: 'Modern Agriculture Techniques', category: 'Agriculture', instructor: 'David Green', price: 59.99, duration: '15 hours', students: 3421, rating: 4.5, level: 'Beginner', lessons: 30, description: 'Learn sustainable and efficient farming methods' },
  { id: 'c13', title: 'Organic Farming Certification', category: 'Agriculture', instructor: 'Maria Santos', price: 99.99, duration: '30 hours', students: 2345, rating: 4.7, level: 'Intermediate', lessons: 50, description: 'Complete guide to organic certification and practices' },
  { id: 'c14', title: 'Agricultural Technology & IoT', category: 'Agriculture', instructor: 'Tom Harris', price: 129.99, duration: '35 hours', students: 1876, rating: 4.8, level: 'Advanced', lessons: 65, description: 'Implement smart farming solutions with technology' },
  
  // Healthcare
  { id: 'c15', title: 'First Aid & Emergency Response', category: 'Healthcare', instructor: 'Dr. Jane Miller', price: 49.99, duration: '10 hours', students: 15678, rating: 4.9, level: 'Beginner', lessons: 25, description: 'Essential first aid skills for emergencies' },
  { id: 'c16', title: 'Nutrition & Dietetics', category: 'Healthcare', instructor: 'Dr. Amy Wilson', price: 79.99, duration: '20 hours', students: 8765, rating: 4.7, level: 'Intermediate', lessons: 45, description: 'Understand nutrition science and meal planning' },
  { id: 'c17', title: 'Mental Health Awareness', category: 'Healthcare', instructor: 'Dr. Mark Thompson', price: 59.99, duration: '15 hours', students: 12345, rating: 4.8, level: 'Beginner', lessons: 30, description: 'Recognize and support mental health challenges' },
  
  // Design
  { id: 'c18', title: 'UI/UX Design Fundamentals', category: 'Design', instructor: 'Chris Martin', price: 89.99, duration: '30 hours', students: 7654, rating: 4.8, level: 'Beginner', lessons: 55, description: 'Design beautiful and user-friendly interfaces' },
  { id: 'c19', title: 'Graphic Design with Adobe Suite', category: 'Design', instructor: 'Anna Lopez', price: 99.99, duration: '40 hours', students: 6543, rating: 4.7, level: 'Intermediate', lessons: 80, description: 'Master Photoshop, Illustrator, and InDesign' },
  { id: 'c20', title: '3D Modeling & Animation', category: 'Design', instructor: 'Ryan Carter', price: 149.99, duration: '50 hours', students: 4321, rating: 4.9, level: 'Advanced', lessons: 90, description: 'Create stunning 3D models and animations' },
  
  // Blockchain
  { id: 'c21', title: 'Blockchain Development', category: 'Blockchain', instructor: 'Michael Chen', price: 149.99, duration: '50 hours', students: 6782, rating: 4.8, level: 'Advanced', lessons: 85, description: 'Build decentralized applications on blockchain' },
  { id: 'c22', title: 'Cryptocurrency Trading', category: 'Blockchain', instructor: 'Kevin Park', price: 79.99, duration: '20 hours', students: 11234, rating: 4.6, level: 'Beginner', lessons: 40, description: 'Trade cryptocurrencies safely and profitably' },
  { id: 'c23', title: 'Smart Contract Development', category: 'Blockchain', instructor: 'Laura Kim', price: 129.99, duration: '35 hours', students: 3456, rating: 4.9, level: 'Advanced', lessons: 60, description: 'Write and deploy smart contracts on Ethereum' },
  
  // Languages
  { id: 'c24', title: 'Spanish for Beginners', category: 'Languages', instructor: 'Carlos Rodriguez', price: 49.99, duration: '20 hours', students: 18765, rating: 4.7, level: 'Beginner', lessons: 50, description: 'Start speaking Spanish in just 30 days' },
  { id: 'c25', title: 'Business English', category: 'Languages', instructor: 'Jennifer Adams', price: 59.99, duration: '25 hours', students: 14567, rating: 4.8, level: 'Intermediate', lessons: 55, description: 'Professional English for the workplace' },
  { id: 'c26', title: 'Mandarin Chinese Essentials', category: 'Languages', instructor: 'Wei Zhang', price: 69.99, duration: '30 hours', students: 8765, rating: 4.6, level: 'Beginner', lessons: 60, description: 'Learn Chinese characters and conversation' },
];

export const educationalVideos: Video[] = [
  // Technology
  { id: 'v1', title: 'Introduction to JavaScript', category: 'Technology', duration: '45 min', views: 125000, thumbnail: '', instructor: 'John Smith', description: 'Learn JavaScript basics and fundamentals' },
  { id: 'v2', title: 'Building Your First React App', category: 'Technology', duration: '1 hr 20 min', views: 89000, thumbnail: '', instructor: 'Emily Chen', description: 'Step-by-step React application development' },
  { id: 'v3', title: 'Python Crash Course', category: 'Technology', duration: '2 hr', views: 234000, thumbnail: '', instructor: 'David Lee', description: 'Complete Python tutorial for beginners' },
  { id: 'v4', title: 'Database Design Fundamentals', category: 'Technology', duration: '55 min', views: 67000, thumbnail: '', instructor: 'Sarah Johnson', description: 'Design efficient and scalable databases' },
  { id: 'v5', title: 'API Development with Node.js', category: 'Technology', duration: '1 hr 30 min', views: 78000, thumbnail: '', instructor: 'Mike Wilson', description: 'Build RESTful APIs from scratch' },
  
  // Business
  { id: 'v6', title: 'Startup Pitch Perfect', category: 'Business', duration: '30 min', views: 156000, thumbnail: '', instructor: 'Robert Brown', description: 'Create compelling investor pitches' },
  { id: 'v7', title: 'Leadership Skills for Managers', category: 'Business', duration: '45 min', views: 123000, thumbnail: '', instructor: 'Lisa Anderson', description: 'Develop essential leadership qualities' },
  { id: 'v8', title: 'Financial Planning 101', category: 'Business', duration: '1 hr', views: 89000, thumbnail: '', instructor: 'James Taylor', description: 'Master personal and business finances' },
  
  // Healthcare
  { id: 'v9', title: 'CPR & Basic Life Support', category: 'Healthcare', duration: '25 min', views: 345000, thumbnail: '', instructor: 'Dr. Jane Miller', description: 'Life-saving CPR techniques everyone should know' },
  { id: 'v10', title: 'Understanding Diabetes', category: 'Healthcare', duration: '40 min', views: 178000, thumbnail: '', instructor: 'Dr. Amy Wilson', description: 'Prevention and management of diabetes' },
  { id: 'v11', title: 'Stress Management Techniques', category: 'Healthcare', duration: '35 min', views: 267000, thumbnail: '', instructor: 'Dr. Mark Thompson', description: 'Effective methods to reduce stress' },
  { id: 'v12', title: 'Healthy Eating Habits', category: 'Healthcare', duration: '50 min', views: 198000, thumbnail: '', instructor: 'Dr. Sarah Lee', description: 'Nutrition tips for a healthier life' },
  { id: 'v13', title: 'Home Remedies for Common Ailments', category: 'Healthcare', duration: '45 min', views: 234000, thumbnail: '', instructor: 'Dr. Maria Santos', description: 'Natural remedies for everyday health issues' },
  
  // Agriculture
  { id: 'v14', title: 'Soil Health & Preparation', category: 'Agriculture', duration: '40 min', views: 45000, thumbnail: '', instructor: 'David Green', description: 'Prepare soil for optimal crop growth' },
  { id: 'v15', title: 'Irrigation Techniques', category: 'Agriculture', duration: '35 min', views: 38000, thumbnail: '', instructor: 'Tom Harris', description: 'Efficient water management for farms' },
  { id: 'v16', title: 'Pest Control Without Chemicals', category: 'Agriculture', duration: '50 min', views: 56000, thumbnail: '', instructor: 'Maria Santos', description: 'Natural pest management strategies' },
  
  // Marketing
  { id: 'v17', title: 'SEO in 2024', category: 'Marketing', duration: '1 hr', views: 145000, thumbnail: '', instructor: 'Emma White', description: 'Latest SEO strategies that work' },
  { id: 'v18', title: 'Facebook Ads Mastery', category: 'Marketing', duration: '1 hr 15 min', views: 189000, thumbnail: '', instructor: 'Alex Turner', description: 'Create high-converting Facebook campaigns' },
  { id: 'v19', title: 'Email Marketing That Converts', category: 'Marketing', duration: '45 min', views: 98000, thumbnail: '', instructor: 'Sarah Johnson', description: 'Build effective email campaigns' },
  
  // Design
  { id: 'v20', title: 'Color Theory Basics', category: 'Design', duration: '30 min', views: 78000, thumbnail: '', instructor: 'Chris Martin', description: 'Understand color psychology and usage' },
  { id: 'v21', title: 'Typography Fundamentals', category: 'Design', duration: '35 min', views: 65000, thumbnail: '', instructor: 'Anna Lopez', description: 'Master the art of typography' },
  { id: 'v22', title: 'Logo Design Process', category: 'Design', duration: '55 min', views: 112000, thumbnail: '', instructor: 'Ryan Carter', description: 'Create memorable brand logos' },
];

export const educationalDocuments: Document[] = [
  // Technology
  { id: 'd1', title: 'Complete JavaScript Reference Guide', category: 'Technology', type: 'PDF', pages: 150, author: 'John Smith', description: 'Comprehensive JavaScript documentation', downloadCount: 45000 },
  { id: 'd2', title: 'React Best Practices 2024', category: 'Technology', type: 'Ebook', pages: 85, author: 'Emily Chen', description: 'Modern React development patterns', downloadCount: 32000 },
  { id: 'd3', title: 'Python Data Science Handbook', category: 'Technology', type: 'PDF', pages: 200, author: 'David Lee', description: 'Essential guide for data scientists', downloadCount: 67000 },
  { id: 'd4', title: 'Cloud Architecture Patterns', category: 'Technology', type: 'Guide', pages: 120, author: 'Sarah Johnson', description: 'Design scalable cloud systems', downloadCount: 28000 },
  
  // Business
  { id: 'd5', title: 'Business Plan Template', category: 'Business', type: 'PDF', pages: 25, author: 'Robert Brown', description: 'Complete business plan framework', downloadCount: 89000 },
  { id: 'd6', title: 'Financial Modeling Guide', category: 'Business', type: 'Ebook', pages: 95, author: 'Lisa Anderson', description: 'Build financial models like a pro', downloadCount: 34000 },
  { id: 'd7', title: 'Project Management Handbook', category: 'Business', type: 'PDF', pages: 180, author: 'James Taylor', description: 'Complete PM methodology guide', downloadCount: 56000 },
  
  // Healthcare
  { id: 'd8', title: 'First Aid Manual', category: 'Healthcare', type: 'PDF', pages: 60, author: 'Dr. Jane Miller', description: 'Essential first aid procedures', downloadCount: 123000 },
  { id: 'd9', title: 'Nutrition Guide for Healthy Living', category: 'Healthcare', type: 'Ebook', pages: 100, author: 'Dr. Amy Wilson', description: 'Complete nutrition reference', downloadCount: 78000 },
  { id: 'd10', title: 'Mental Wellness Workbook', category: 'Healthcare', type: 'Guide', pages: 45, author: 'Dr. Mark Thompson', description: 'Exercises for mental health', downloadCount: 67000 },
  { id: 'd11', title: 'Preventive Healthcare Guide', category: 'Healthcare', type: 'PDF', pages: 80, author: 'Dr. Sarah Lee', description: 'Prevention strategies for common diseases', downloadCount: 89000 },
  { id: 'd12', title: 'Herbal Remedies Encyclopedia', category: 'Healthcare', type: 'Ebook', pages: 200, author: 'Dr. Maria Santos', description: 'Natural healing methods and herbs', downloadCount: 45000 },
  
  // Agriculture
  { id: 'd13', title: 'Organic Farming Guide', category: 'Agriculture', type: 'PDF', pages: 75, author: 'David Green', description: 'Complete organic farming methods', downloadCount: 23000 },
  { id: 'd14', title: 'Crop Rotation Strategies', category: 'Agriculture', type: 'Guide', pages: 40, author: 'Tom Harris', description: 'Maximize yield with rotation', downloadCount: 18000 },
  { id: 'd15', title: 'Agricultural Business Planning', category: 'Agriculture', type: 'Ebook', pages: 90, author: 'Maria Santos', description: 'Start and grow farm businesses', downloadCount: 15000 },
  
  // Marketing
  { id: 'd16', title: 'Digital Marketing Playbook', category: 'Marketing', type: 'PDF', pages: 110, author: 'Emma White', description: 'Complete digital marketing guide', downloadCount: 67000 },
  { id: 'd17', title: 'Social Media Strategy Template', category: 'Marketing', type: 'Guide', pages: 35, author: 'Alex Turner', description: 'Plan your social media presence', downloadCount: 89000 },
  { id: 'd18', title: 'Content Marketing Bible', category: 'Marketing', type: 'Ebook', pages: 150, author: 'Sarah Johnson', description: 'Master content creation', downloadCount: 45000 },
  
  // Design
  { id: 'd19', title: 'UI/UX Design Principles', category: 'Design', type: 'PDF', pages: 85, author: 'Chris Martin', description: 'Essential design principles', downloadCount: 56000 },
  { id: 'd20', title: 'Brand Identity Guidelines', category: 'Design', type: 'Guide', pages: 50, author: 'Anna Lopez', description: 'Create consistent brand identities', downloadCount: 34000 },
];

export const learnCategories = [
  { id: 'technology', name: 'Technology', icon: '💻', color: '#3B82F6' },
  { id: 'business', name: 'Business', icon: '💼', color: '#8B5CF6' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: '#F59E0B' },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾', color: '#10B981' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#EC4899' },
  { id: 'design', name: 'Design', icon: '🎨', color: '#6366F1' },
  { id: 'blockchain', name: 'Blockchain', icon: '⛓️', color: '#14B8A6' },
  { id: 'languages', name: 'Languages', icon: '🌍', color: '#F97316' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#22C55E' },
  { id: 'personal', name: 'Personal Development', icon: '🧠', color: '#A855F7' },
];
