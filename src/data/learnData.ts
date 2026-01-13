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
  { id: 'c6', title: 'Machine Learning A-Z', category: 'Technology', instructor: 'Dr. Andrew Kim', price: 159.99, duration: '55 hours', students: 15432, rating: 4.9, level: 'Advanced', lessons: 110, description: 'Complete guide to machine learning algorithms and deep learning' },
  { id: 'c7', title: 'Full Stack JavaScript Developer', category: 'Technology', instructor: 'Alex Turner', price: 139.99, duration: '60 hours', students: 11234, rating: 4.8, level: 'Intermediate', lessons: 130, description: 'Become a full stack developer with MERN stack' },
  { id: 'c8', title: 'DevOps Engineering Masterclass', category: 'Technology', instructor: 'Chris Martin', price: 169.99, duration: '50 hours', students: 5678, rating: 4.7, level: 'Advanced', lessons: 85, description: 'CI/CD pipelines, Docker, Kubernetes, and more' },
  
  // Business
  { id: 'c9', title: 'Business Strategy Masterclass', category: 'Business', instructor: 'Robert Brown', price: 79.99, duration: '25 hours', students: 5432, rating: 4.7, level: 'Intermediate', lessons: 45, description: 'Develop winning business strategies for growth' },
  { id: 'c10', title: 'Financial Management for Entrepreneurs', category: 'Business', instructor: 'Lisa Anderson', price: 89.99, duration: '20 hours', students: 4321, rating: 4.6, level: 'Beginner', lessons: 40, description: 'Manage finances and build profitable businesses' },
  { id: 'c11', title: 'Project Management Professional (PMP)', category: 'Business', instructor: 'James Taylor', price: 199.99, duration: '60 hours', students: 11234, rating: 4.9, level: 'Advanced', lessons: 110, description: 'Complete PMP certification preparation course' },
  { id: 'c12', title: 'Entrepreneurship 101', category: 'Business', instructor: 'Mark Cuban Jr', price: 69.99, duration: '18 hours', students: 8765, rating: 4.8, level: 'Beginner', lessons: 35, description: 'Start your business journey with proven frameworks' },
  { id: 'c13', title: 'Leadership & Team Management', category: 'Business', instructor: 'Jennifer Adams', price: 94.99, duration: '22 hours', students: 6543, rating: 4.7, level: 'Intermediate', lessons: 48, description: 'Lead teams effectively and drive results' },
  
  // Marketing
  { id: 'c14', title: 'Digital Marketing Mastery', category: 'Marketing', instructor: 'Sarah Johnson', price: 79.99, duration: '25 hours', students: 8932, rating: 4.8, level: 'Beginner', lessons: 55, description: 'Master SEO, social media, and online advertising' },
  { id: 'c15', title: 'Content Marketing Strategy', category: 'Marketing', instructor: 'Emma White', price: 69.99, duration: '20 hours', students: 6789, rating: 4.7, level: 'Intermediate', lessons: 40, description: 'Create compelling content that drives engagement' },
  { id: 'c16', title: 'Social Media Marketing', category: 'Marketing', instructor: 'Alex Turner', price: 59.99, duration: '15 hours', students: 9876, rating: 4.6, level: 'Beginner', lessons: 35, description: 'Grow your brand on social platforms' },
  { id: 'c17', title: 'Google Ads Certification', category: 'Marketing', instructor: 'Kevin Park', price: 84.99, duration: '28 hours', students: 7654, rating: 4.8, level: 'Intermediate', lessons: 52, description: 'Master Google Ads and PPC campaigns' },
  { id: 'c18', title: 'Email Marketing Pro', category: 'Marketing', instructor: 'Laura Kim', price: 54.99, duration: '12 hours', students: 5432, rating: 4.5, level: 'Beginner', lessons: 28, description: 'Build effective email marketing campaigns' },
  
  // Agriculture
  { id: 'c19', title: 'Modern Agriculture Techniques', category: 'Agriculture', instructor: 'David Green', price: 59.99, duration: '15 hours', students: 3421, rating: 4.5, level: 'Beginner', lessons: 30, description: 'Learn sustainable and efficient farming methods' },
  { id: 'c20', title: 'Organic Farming Certification', category: 'Agriculture', instructor: 'Maria Santos', price: 99.99, duration: '30 hours', students: 2345, rating: 4.7, level: 'Intermediate', lessons: 50, description: 'Complete guide to organic certification and practices' },
  { id: 'c21', title: 'Agricultural Technology & IoT', category: 'Agriculture', instructor: 'Tom Harris', price: 129.99, duration: '35 hours', students: 1876, rating: 4.8, level: 'Advanced', lessons: 65, description: 'Implement smart farming solutions with technology' },
  { id: 'c22', title: 'Livestock Management', category: 'Agriculture', instructor: 'Dr. John Farmer', price: 74.99, duration: '20 hours', students: 2987, rating: 4.6, level: 'Intermediate', lessons: 42, description: 'Best practices for animal husbandry and care' },
  { id: 'c23', title: 'Hydroponics & Vertical Farming', category: 'Agriculture', instructor: 'Anna Lopez', price: 89.99, duration: '25 hours', students: 1543, rating: 4.7, level: 'Intermediate', lessons: 48, description: 'Grow crops without soil using modern techniques' },
  
  // Healthcare
  { id: 'c24', title: 'First Aid & Emergency Response', category: 'Healthcare', instructor: 'Dr. Jane Miller', price: 49.99, duration: '10 hours', students: 15678, rating: 4.9, level: 'Beginner', lessons: 25, description: 'Essential first aid skills for emergencies' },
  { id: 'c25', title: 'Nutrition & Dietetics', category: 'Healthcare', instructor: 'Dr. Amy Wilson', price: 79.99, duration: '20 hours', students: 8765, rating: 4.7, level: 'Intermediate', lessons: 45, description: 'Understand nutrition science and meal planning' },
  { id: 'c26', title: 'Mental Health Awareness', category: 'Healthcare', instructor: 'Dr. Mark Thompson', price: 59.99, duration: '15 hours', students: 12345, rating: 4.8, level: 'Beginner', lessons: 30, description: 'Recognize and support mental health challenges' },
  { id: 'c27', title: 'Medical Terminology', category: 'Healthcare', instructor: 'Dr. Sarah Lee', price: 44.99, duration: '12 hours', students: 9876, rating: 4.6, level: 'Beginner', lessons: 28, description: 'Learn medical terms used in healthcare' },
  { id: 'c28', title: 'Caregiving Essentials', category: 'Healthcare', instructor: 'Nurse Mary Johnson', price: 64.99, duration: '18 hours', students: 6543, rating: 4.7, level: 'Beginner', lessons: 38, description: 'Professional caregiving skills and techniques' },
  
  // Design
  { id: 'c29', title: 'UI/UX Design Fundamentals', category: 'Design', instructor: 'Chris Martin', price: 89.99, duration: '30 hours', students: 7654, rating: 4.8, level: 'Beginner', lessons: 55, description: 'Design beautiful and user-friendly interfaces' },
  { id: 'c30', title: 'Graphic Design with Adobe Suite', category: 'Design', instructor: 'Anna Lopez', price: 99.99, duration: '40 hours', students: 6543, rating: 4.7, level: 'Intermediate', lessons: 80, description: 'Master Photoshop, Illustrator, and InDesign' },
  { id: 'c31', title: '3D Modeling & Animation', category: 'Design', instructor: 'Ryan Carter', price: 149.99, duration: '50 hours', students: 4321, rating: 4.9, level: 'Advanced', lessons: 90, description: 'Create stunning 3D models and animations' },
  { id: 'c32', title: 'Video Editing Masterclass', category: 'Design', instructor: 'Michael Brown', price: 79.99, duration: '28 hours', students: 8765, rating: 4.7, level: 'Intermediate', lessons: 52, description: 'Professional video editing with Premiere Pro' },
  
  // Blockchain
  { id: 'c33', title: 'Blockchain Development', category: 'Blockchain', instructor: 'Michael Chen', price: 149.99, duration: '50 hours', students: 6782, rating: 4.8, level: 'Advanced', lessons: 85, description: 'Build decentralized applications on blockchain' },
  { id: 'c34', title: 'Cryptocurrency Trading', category: 'Blockchain', instructor: 'Kevin Park', price: 79.99, duration: '20 hours', students: 11234, rating: 4.6, level: 'Beginner', lessons: 40, description: 'Trade cryptocurrencies safely and profitably' },
  { id: 'c35', title: 'Smart Contract Development', category: 'Blockchain', instructor: 'Laura Kim', price: 129.99, duration: '35 hours', students: 3456, rating: 4.9, level: 'Advanced', lessons: 60, description: 'Write and deploy smart contracts on Ethereum' },
  { id: 'c36', title: 'NFT Creation & Marketing', category: 'Blockchain', instructor: 'Jake Wilson', price: 69.99, duration: '15 hours', students: 8765, rating: 4.5, level: 'Beginner', lessons: 32, description: 'Create, mint, and sell NFTs successfully' },
  
  // Languages
  { id: 'c37', title: 'Spanish for Beginners', category: 'Languages', instructor: 'Carlos Rodriguez', price: 49.99, duration: '20 hours', students: 18765, rating: 4.7, level: 'Beginner', lessons: 50, description: 'Start speaking Spanish in just 30 days' },
  { id: 'c38', title: 'Business English', category: 'Languages', instructor: 'Jennifer Adams', price: 59.99, duration: '25 hours', students: 14567, rating: 4.8, level: 'Intermediate', lessons: 55, description: 'Professional English for the workplace' },
  { id: 'c39', title: 'Mandarin Chinese Essentials', category: 'Languages', instructor: 'Wei Zhang', price: 69.99, duration: '30 hours', students: 8765, rating: 4.6, level: 'Beginner', lessons: 60, description: 'Learn Chinese characters and conversation' },
  { id: 'c40', title: 'French for Travel', category: 'Languages', instructor: 'Marie Dubois', price: 44.99, duration: '15 hours', students: 12345, rating: 4.7, level: 'Beginner', lessons: 35, description: 'Essential French for travelers' },
];

export const educationalVideos: Video[] = [
  // Technology - Extended
  { id: 'v1', title: 'Introduction to JavaScript', category: 'Technology', duration: '45 min', views: 125000, thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400', instructor: 'John Smith', description: 'Learn JavaScript basics and fundamentals' },
  { id: 'v2', title: 'Building Your First React App', category: 'Technology', duration: '1 hr 20 min', views: 89000, thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', instructor: 'Emily Chen', description: 'Step-by-step React application development' },
  { id: 'v3', title: 'Python Crash Course', category: 'Technology', duration: '2 hr', views: 234000, thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400', instructor: 'David Lee', description: 'Complete Python tutorial for beginners' },
  { id: 'v4', title: 'Database Design Fundamentals', category: 'Technology', duration: '55 min', views: 67000, thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400', instructor: 'Sarah Johnson', description: 'Design efficient and scalable databases' },
  { id: 'v5', title: 'API Development with Node.js', category: 'Technology', duration: '1 hr 30 min', views: 78000, thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', instructor: 'Mike Wilson', description: 'Build RESTful APIs from scratch' },
  { id: 'v6', title: 'CSS Grid & Flexbox Mastery', category: 'Technology', duration: '1 hr 15 min', views: 156000, thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', instructor: 'Anna Lopez', description: 'Modern CSS layout techniques explained' },
  { id: 'v7', title: 'Git & GitHub for Beginners', category: 'Technology', duration: '50 min', views: 198000, thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400', instructor: 'Chris Martin', description: 'Version control essentials for developers' },
  { id: 'v8', title: 'TypeScript Complete Tutorial', category: 'Technology', duration: '2 hr 30 min', views: 145000, thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400', instructor: 'Alex Turner', description: 'Type-safe JavaScript development' },
  { id: 'v9', title: 'Docker for Developers', category: 'Technology', duration: '1 hr 45 min', views: 89000, thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400', instructor: 'Kevin Park', description: 'Containerization made simple' },
  { id: 'v10', title: 'AWS Lambda Deep Dive', category: 'Technology', duration: '1 hr 20 min', views: 67000, thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', instructor: 'Laura Kim', description: 'Serverless computing with AWS' },
  
  // Business - Extended
  { id: 'v11', title: 'Startup Pitch Perfect', category: 'Business', duration: '30 min', views: 156000, thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', instructor: 'Robert Brown', description: 'Create compelling investor pitches' },
  { id: 'v12', title: 'Leadership Skills for Managers', category: 'Business', duration: '45 min', views: 123000, thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', instructor: 'Lisa Anderson', description: 'Develop essential leadership qualities' },
  { id: 'v13', title: 'Financial Planning 101', category: 'Business', duration: '1 hr', views: 89000, thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', instructor: 'James Taylor', description: 'Master personal and business finances' },
  { id: 'v14', title: 'Negotiation Tactics', category: 'Business', duration: '40 min', views: 98000, thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400', instructor: 'Mark Cuban Jr', description: 'Win every negotiation with proven tactics' },
  { id: 'v15', title: 'Building Business Systems', category: 'Business', duration: '55 min', views: 76000, thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', instructor: 'Jennifer Adams', description: 'Create systems that scale your business' },
  
  // Healthcare - Extended
  { id: 'v16', title: 'CPR & Basic Life Support', category: 'Healthcare', duration: '25 min', views: 345000, thumbnail: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=400', instructor: 'Dr. Jane Miller', description: 'Life-saving CPR techniques everyone should know' },
  { id: 'v17', title: 'Understanding Diabetes', category: 'Healthcare', duration: '40 min', views: 178000, thumbnail: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400', instructor: 'Dr. Amy Wilson', description: 'Prevention and management of diabetes' },
  { id: 'v18', title: 'Stress Management Techniques', category: 'Healthcare', duration: '35 min', views: 267000, thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', instructor: 'Dr. Mark Thompson', description: 'Effective methods to reduce stress' },
  { id: 'v19', title: 'Healthy Eating Habits', category: 'Healthcare', duration: '50 min', views: 198000, thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', instructor: 'Dr. Sarah Lee', description: 'Nutrition tips for a healthier life' },
  { id: 'v20', title: 'Home Remedies for Common Ailments', category: 'Healthcare', duration: '45 min', views: 234000, thumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400', instructor: 'Dr. Maria Santos', description: 'Natural remedies for everyday health issues' },
  { id: 'v21', title: 'Mental Wellness Daily Practices', category: 'Healthcare', duration: '30 min', views: 289000, thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', instructor: 'Dr. Emma White', description: 'Daily habits for mental health' },
  { id: 'v22', title: 'Yoga for Beginners', category: 'Healthcare', duration: '1 hr', views: 456000, thumbnail: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400', instructor: 'Instructor Laura Kim', description: 'Start your yoga journey today' },
  
  // Agriculture - Extended
  { id: 'v23', title: 'Soil Health & Preparation', category: 'Agriculture', duration: '40 min', views: 45000, thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', instructor: 'David Green', description: 'Prepare soil for optimal crop growth' },
  { id: 'v24', title: 'Irrigation Techniques', category: 'Agriculture', duration: '35 min', views: 38000, thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', instructor: 'Tom Harris', description: 'Efficient water management for farms' },
  { id: 'v25', title: 'Pest Control Without Chemicals', category: 'Agriculture', duration: '50 min', views: 56000, thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', instructor: 'Maria Santos', description: 'Natural pest management strategies' },
  { id: 'v26', title: 'Greenhouse Farming Guide', category: 'Agriculture', duration: '1 hr', views: 34000, thumbnail: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400', instructor: 'John Farmer', description: 'Year-round farming with greenhouses' },
  { id: 'v27', title: 'Poultry Farming Basics', category: 'Agriculture', duration: '45 min', views: 67000, thumbnail: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400', instructor: 'Anna Lopez', description: 'Start your poultry business' },
  
  // Marketing - Extended
  { id: 'v28', title: 'SEO in 2024', category: 'Marketing', duration: '1 hr', views: 145000, thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400', instructor: 'Emma White', description: 'Latest SEO strategies that work' },
  { id: 'v29', title: 'Facebook Ads Mastery', category: 'Marketing', duration: '1 hr 15 min', views: 189000, thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', instructor: 'Alex Turner', description: 'Create high-converting Facebook campaigns' },
  { id: 'v30', title: 'Email Marketing That Converts', category: 'Marketing', duration: '45 min', views: 98000, thumbnail: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400', instructor: 'Sarah Johnson', description: 'Build effective email campaigns' },
  { id: 'v31', title: 'TikTok Marketing Secrets', category: 'Marketing', duration: '40 min', views: 234000, thumbnail: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400', instructor: 'Jake Wilson', description: 'Go viral on TikTok for business' },
  { id: 'v32', title: 'LinkedIn for B2B Marketing', category: 'Marketing', duration: '50 min', views: 87000, thumbnail: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400', instructor: 'Jennifer Adams', description: 'Generate B2B leads on LinkedIn' },
  
  // Design - Extended
  { id: 'v33', title: 'Color Theory Basics', category: 'Design', duration: '30 min', views: 78000, thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400', instructor: 'Chris Martin', description: 'Understand color psychology and usage' },
  { id: 'v34', title: 'Typography Fundamentals', category: 'Design', duration: '35 min', views: 65000, thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', instructor: 'Anna Lopez', description: 'Master the art of typography' },
  { id: 'v35', title: 'Logo Design Process', category: 'Design', duration: '55 min', views: 112000, thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400', instructor: 'Ryan Carter', description: 'Create memorable brand logos' },
  { id: 'v36', title: 'Figma for UI Design', category: 'Design', duration: '1 hr 30 min', views: 167000, thumbnail: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400', instructor: 'Michael Brown', description: 'Design interfaces with Figma' },
  { id: 'v37', title: 'Motion Graphics Basics', category: 'Design', duration: '1 hr', views: 89000, thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', instructor: 'Kevin Park', description: 'Animate graphics with After Effects' },
];

export const educationalDocuments: Document[] = [
  // Technology - Extended
  { id: 'd1', title: 'Complete JavaScript Reference Guide', category: 'Technology', type: 'PDF', pages: 150, author: 'John Smith', description: 'Comprehensive JavaScript documentation', downloadCount: 45000 },
  { id: 'd2', title: 'React Best Practices 2024', category: 'Technology', type: 'Ebook', pages: 85, author: 'Emily Chen', description: 'Modern React development patterns', downloadCount: 32000 },
  { id: 'd3', title: 'Python Data Science Handbook', category: 'Technology', type: 'PDF', pages: 200, author: 'David Lee', description: 'Essential guide for data scientists', downloadCount: 67000 },
  { id: 'd4', title: 'Cloud Architecture Patterns', category: 'Technology', type: 'Guide', pages: 120, author: 'Sarah Johnson', description: 'Design scalable cloud systems', downloadCount: 28000 },
  { id: 'd5', title: 'TypeScript Cheat Sheet', category: 'Technology', type: 'PDF', pages: 25, author: 'Alex Turner', description: 'Quick reference for TypeScript', downloadCount: 89000 },
  { id: 'd6', title: 'Docker & Kubernetes Guide', category: 'Technology', type: 'Ebook', pages: 180, author: 'Kevin Park', description: 'Container orchestration explained', downloadCount: 34000 },
  { id: 'd7', title: 'API Design Best Practices', category: 'Technology', type: 'Guide', pages: 75, author: 'Mike Wilson', description: 'Build better APIs', downloadCount: 45000 },
  { id: 'd8', title: 'SQL Mastery Guide', category: 'Technology', type: 'PDF', pages: 130, author: 'Laura Kim', description: 'Advanced SQL techniques', downloadCount: 56000 },
  
  // Business - Extended
  { id: 'd9', title: 'Business Plan Template', category: 'Business', type: 'PDF', pages: 25, author: 'Robert Brown', description: 'Complete business plan framework', downloadCount: 89000 },
  { id: 'd10', title: 'Financial Modeling Guide', category: 'Business', type: 'Ebook', pages: 95, author: 'Lisa Anderson', description: 'Build financial models like a pro', downloadCount: 34000 },
  { id: 'd11', title: 'Project Management Handbook', category: 'Business', type: 'PDF', pages: 180, author: 'James Taylor', description: 'Complete PM methodology guide', downloadCount: 56000 },
  { id: 'd12', title: 'Startup Funding Guide', category: 'Business', type: 'Ebook', pages: 65, author: 'Mark Cuban Jr', description: 'How to raise capital for your startup', downloadCount: 78000 },
  { id: 'd13', title: 'Team Building Workbook', category: 'Business', type: 'Guide', pages: 45, author: 'Jennifer Adams', description: 'Build high-performing teams', downloadCount: 23000 },
  
  // Healthcare - Extended
  { id: 'd14', title: 'First Aid Manual', category: 'Healthcare', type: 'PDF', pages: 60, author: 'Dr. Jane Miller', description: 'Essential first aid procedures', downloadCount: 123000 },
  { id: 'd15', title: 'Nutrition Guide for Healthy Living', category: 'Healthcare', type: 'Ebook', pages: 100, author: 'Dr. Amy Wilson', description: 'Complete nutrition reference', downloadCount: 78000 },
  { id: 'd16', title: 'Mental Wellness Workbook', category: 'Healthcare', type: 'Guide', pages: 45, author: 'Dr. Mark Thompson', description: 'Exercises for mental health', downloadCount: 67000 },
  { id: 'd17', title: 'Preventive Healthcare Guide', category: 'Healthcare', type: 'PDF', pages: 80, author: 'Dr. Sarah Lee', description: 'Prevention strategies for common diseases', downloadCount: 89000 },
  { id: 'd18', title: 'Herbal Remedies Encyclopedia', category: 'Healthcare', type: 'Ebook', pages: 200, author: 'Dr. Maria Santos', description: 'Natural healing methods and herbs', downloadCount: 45000 },
  { id: 'd19', title: 'Home Exercise Program', category: 'Healthcare', type: 'PDF', pages: 55, author: 'Trainer Alex', description: 'Complete home workout guide', downloadCount: 134000 },
  { id: 'd20', title: 'Sleep Improvement Guide', category: 'Healthcare', type: 'Guide', pages: 35, author: 'Dr. Emma White', description: 'Get better sleep naturally', downloadCount: 98000 },
  
  // Agriculture - Extended
  { id: 'd21', title: 'Organic Farming Guide', category: 'Agriculture', type: 'PDF', pages: 75, author: 'David Green', description: 'Complete organic farming methods', downloadCount: 23000 },
  { id: 'd22', title: 'Crop Rotation Strategies', category: 'Agriculture', type: 'Guide', pages: 40, author: 'Tom Harris', description: 'Maximize yield with rotation', downloadCount: 18000 },
  { id: 'd23', title: 'Agricultural Business Planning', category: 'Agriculture', type: 'Ebook', pages: 90, author: 'Maria Santos', description: 'Start and grow farm businesses', downloadCount: 15000 },
  { id: 'd24', title: 'Composting Made Easy', category: 'Agriculture', type: 'PDF', pages: 30, author: 'John Farmer', description: 'Turn waste into garden gold', downloadCount: 34000 },
  { id: 'd25', title: 'Beekeeping Starter Guide', category: 'Agriculture', type: 'Guide', pages: 50, author: 'Anna Lopez', description: 'Start your own bee colony', downloadCount: 21000 },
  
  // Marketing - Extended
  { id: 'd26', title: 'Digital Marketing Playbook', category: 'Marketing', type: 'PDF', pages: 110, author: 'Emma White', description: 'Complete digital marketing guide', downloadCount: 67000 },
  { id: 'd27', title: 'Social Media Strategy Template', category: 'Marketing', type: 'Guide', pages: 35, author: 'Alex Turner', description: 'Plan your social media presence', downloadCount: 89000 },
  { id: 'd28', title: 'Content Marketing Bible', category: 'Marketing', type: 'Ebook', pages: 150, author: 'Sarah Johnson', description: 'Master content creation', downloadCount: 45000 },
  { id: 'd29', title: 'Copywriting Formulas', category: 'Marketing', type: 'PDF', pages: 40, author: 'Jake Wilson', description: 'Write copy that sells', downloadCount: 78000 },
  { id: 'd30', title: 'Analytics Dashboard Guide', category: 'Marketing', type: 'Guide', pages: 55, author: 'Kevin Park', description: 'Measure what matters', downloadCount: 34000 },
  
  // Design - Extended
  { id: 'd31', title: 'UI/UX Design Principles', category: 'Design', type: 'PDF', pages: 85, author: 'Chris Martin', description: 'Essential design principles', downloadCount: 56000 },
  { id: 'd32', title: 'Brand Identity Guidelines', category: 'Design', type: 'Guide', pages: 50, author: 'Anna Lopez', description: 'Create consistent brand identities', downloadCount: 34000 },
  { id: 'd33', title: 'Figma Shortcuts & Tips', category: 'Design', type: 'PDF', pages: 20, author: 'Ryan Carter', description: 'Speed up your Figma workflow', downloadCount: 67000 },
  { id: 'd34', title: 'Design Systems Handbook', category: 'Design', type: 'Ebook', pages: 120, author: 'Michael Brown', description: 'Build scalable design systems', downloadCount: 45000 },
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

// Campaign banners for courses
export const courseCampaignBanners = [
  {
    id: 1,
    title: "Free Web Development Bootcamp",
    description: "Learn HTML, CSS & JavaScript - Get Certified!",
    image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800",
    badge: "FREE COURSE",
    link: "/learn",
    enrollCount: 15678,
  },
  {
    id: 2,
    title: "Business Management Certification",
    description: "Join 10,000+ students - Limited spots available",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    badge: "ENROLL NOW",
    link: "/learn",
    enrollCount: 10234,
  },
  {
    id: 3,
    title: "Agriculture Technology Program",
    description: "Modern farming techniques with IoT certification",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    badge: "NEW BATCH",
    link: "/learn",
    enrollCount: 5678,
  },
  {
    id: 4,
    title: "Healthcare First Responder Course",
    description: "Life-saving skills with official certification",
    image: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800",
    badge: "SAVE LIVES",
    link: "/learn",
    enrollCount: 23456,
  },
  {
    id: 5,
    title: "Digital Marketing Masterclass",
    description: "Become a certified digital marketer in 30 days",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800",
    badge: "50% OFF",
    link: "/learn",
    enrollCount: 18765,
  },
  {
    id: 6,
    title: "UI/UX Design Career Path",
    description: "Design portfolio + job placement assistance",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    badge: "CAREER READY",
    link: "/learn",
    enrollCount: 8765,
  },
];
