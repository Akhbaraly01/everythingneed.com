export interface HealthVideo {
  id: string;
  title: string;
  category: string;
  duration: string;
  views: number;
  instructor: string;
  description: string;
  thumbnail?: string;
}

export interface HealthDocument {
  id: string;
  title: string;
  category: string;
  type: 'PDF' | 'Article' | 'Guide' | 'Infographic' | 'Ebook';
  pages: number;
  author: string;
  description: string;
  downloadCount: number;
}

export interface PreventiveCare {
  id: string;
  title: string;
  category: string;
  description: string;
  tips: string[];
  riskFactors: string[];
  icon: string;
}

export const healthVideos: HealthVideo[] = [
  // First Aid & Emergency
  { id: 'hv1', title: 'CPR Training: Save a Life', category: 'First Aid', duration: '20 min', views: 456000, instructor: 'Dr. Jane Miller', description: 'Step-by-step CPR instructions for adults, children, and infants' },
  { id: 'hv2', title: 'Choking Emergency Response', category: 'First Aid', duration: '15 min', views: 234000, instructor: 'Dr. John Adams', description: 'How to help someone who is choking' },
  { id: 'hv3', title: 'Wound Care & Bandaging', category: 'First Aid', duration: '25 min', views: 189000, instructor: 'Nurse Sarah Lee', description: 'Proper wound cleaning and dressing techniques' },
  { id: 'hv4', title: 'Burns: First Response', category: 'First Aid', duration: '18 min', views: 167000, instructor: 'Dr. Michael Brown', description: 'Immediate care for different types of burns' },
  
  // Disease Prevention
  { id: 'hv5', title: 'Understanding Heart Disease', category: 'Cardiology', duration: '35 min', views: 345000, instructor: 'Dr. Robert Chen', description: 'Prevention and early detection of heart conditions' },
  { id: 'hv6', title: 'Diabetes Prevention & Management', category: 'Endocrinology', duration: '40 min', views: 289000, instructor: 'Dr. Amy Wilson', description: 'Lifestyle changes to prevent and manage diabetes' },
  { id: 'hv7', title: 'Cancer Prevention: What You Can Do', category: 'Oncology', duration: '45 min', views: 412000, instructor: 'Dr. Lisa Thompson', description: 'Evidence-based cancer prevention strategies' },
  { id: 'hv8', title: 'Stroke: Signs & Prevention', category: 'Neurology', duration: '30 min', views: 267000, instructor: 'Dr. Mark Davis', description: 'Recognize stroke signs and prevent occurrences' },
  
  // Mental Health
  { id: 'hv9', title: 'Managing Anxiety Naturally', category: 'Mental Health', duration: '35 min', views: 567000, instructor: 'Dr. Emma White', description: 'Techniques to reduce anxiety without medication' },
  { id: 'hv10', title: 'Depression: Understanding & Coping', category: 'Mental Health', duration: '45 min', views: 456000, instructor: 'Dr. James Wilson', description: 'Comprehensive guide to managing depression' },
  { id: 'hv11', title: 'Sleep Better Tonight', category: 'Mental Health', duration: '25 min', views: 678000, instructor: 'Dr. Sarah Johnson', description: 'Science-backed tips for better sleep' },
  { id: 'hv12', title: 'Stress Management Masterclass', category: 'Mental Health', duration: '40 min', views: 389000, instructor: 'Dr. David Lee', description: 'Effective stress reduction techniques' },
  
  // Nutrition & Fitness
  { id: 'hv13', title: 'Balanced Diet Essentials', category: 'Nutrition', duration: '30 min', views: 345000, instructor: 'Dr. Maria Santos', description: 'Build a healthy, balanced eating plan' },
  { id: 'hv14', title: 'Vitamins & Supplements Guide', category: 'Nutrition', duration: '35 min', views: 234000, instructor: 'Dr. Kevin Park', description: 'What supplements you actually need' },
  { id: 'hv15', title: 'Home Workout for Beginners', category: 'Fitness', duration: '45 min', views: 789000, instructor: 'Trainer Alex Turner', description: 'No-equipment workout routine' },
  { id: 'hv16', title: 'Yoga for Health', category: 'Fitness', duration: '40 min', views: 567000, instructor: 'Instructor Laura Kim', description: 'Gentle yoga for overall wellness' },
  
  // Specific Conditions
  { id: 'hv17', title: 'Managing High Blood Pressure', category: 'Cardiology', duration: '30 min', views: 345000, instructor: 'Dr. Robert Chen', description: 'Natural ways to control hypertension' },
  { id: 'hv18', title: 'Arthritis Pain Relief', category: 'Orthopedics', duration: '25 min', views: 234000, instructor: 'Dr. Jennifer Adams', description: 'Exercises and treatments for arthritis' },
  { id: 'hv19', title: 'Respiratory Health', category: 'Pulmonology', duration: '35 min', views: 189000, instructor: 'Dr. William Green', description: 'Keeping your lungs healthy' },
  { id: 'hv20', title: 'Eye Care & Vision Health', category: 'Ophthalmology', duration: '20 min', views: 156000, instructor: 'Dr. Anna Lopez', description: 'Protect and improve your vision' },
  
  // Children's Health
  { id: 'hv21', title: 'Child Nutrition Basics', category: 'Pediatrics', duration: '30 min', views: 234000, instructor: 'Dr. Emily Brown', description: 'Feeding children for optimal growth' },
  { id: 'hv22', title: 'Common Childhood Illnesses', category: 'Pediatrics', duration: '40 min', views: 345000, instructor: 'Dr. Michael White', description: 'Recognize and respond to common conditions' },
  { id: 'hv23', title: 'Vaccination Guide for Parents', category: 'Pediatrics', duration: '25 min', views: 456000, instructor: 'Dr. Sarah Lee', description: 'Understanding childhood immunizations' },
  
  // Women's Health
  { id: 'hv24', title: 'Women\'s Health Essentials', category: 'Women\'s Health', duration: '45 min', views: 389000, instructor: 'Dr. Lisa Chen', description: 'Health topics every woman should know' },
  { id: 'hv25', title: 'Pregnancy & Prenatal Care', category: 'Women\'s Health', duration: '50 min', views: 456000, instructor: 'Dr. Jennifer Kim', description: 'Healthy pregnancy guidelines' },
];

export const healthDocuments: HealthDocument[] = [
  // First Aid
  { id: 'hd1', title: 'Complete First Aid Manual', category: 'First Aid', type: 'PDF', pages: 80, author: 'Red Cross', description: 'Comprehensive first aid reference guide', downloadCount: 234000 },
  { id: 'hd2', title: 'Emergency Response Checklist', category: 'First Aid', type: 'Guide', pages: 10, author: 'Dr. Jane Miller', description: 'Quick reference for emergencies', downloadCount: 189000 },
  { id: 'hd3', title: 'Home Medicine Cabinet Guide', category: 'First Aid', type: 'PDF', pages: 15, author: 'PharmaCare', description: 'Essential medicines to keep at home', downloadCount: 145000 },
  
  // Disease Prevention
  { id: 'hd4', title: 'Heart Health: Prevention Guide', category: 'Cardiology', type: 'Ebook', pages: 50, author: 'American Heart Association', description: 'Complete guide to heart disease prevention', downloadCount: 178000 },
  { id: 'hd5', title: 'Diabetes Prevention Handbook', category: 'Endocrinology', type: 'PDF', pages: 45, author: 'Dr. Amy Wilson', description: 'Lifestyle changes to prevent diabetes', downloadCount: 156000 },
  { id: 'hd6', title: 'Cancer Screening Guidelines', category: 'Oncology', type: 'Guide', pages: 25, author: 'National Cancer Institute', description: 'When and how to get screened', downloadCount: 234000 },
  { id: 'hd7', title: 'Stroke Prevention & Recognition', category: 'Neurology', type: 'PDF', pages: 30, author: 'Dr. Mark Davis', description: 'FAST signs and prevention tips', downloadCount: 167000 },
  
  // Mental Health
  { id: 'hd8', title: 'Anxiety Management Workbook', category: 'Mental Health', type: 'PDF', pages: 60, author: 'Dr. Emma White', description: 'Self-help exercises for anxiety', downloadCount: 345000 },
  { id: 'hd9', title: 'Depression Self-Care Guide', category: 'Mental Health', type: 'Guide', pages: 40, author: 'Dr. James Wilson', description: 'Daily practices for mental wellness', downloadCount: 289000 },
  { id: 'hd10', title: 'Mindfulness & Meditation Guide', category: 'Mental Health', type: 'Ebook', pages: 55, author: 'Dr. Sarah Johnson', description: 'Begin your mindfulness journey', downloadCount: 234000 },
  
  // Nutrition
  { id: 'hd11', title: 'Complete Nutrition Guide', category: 'Nutrition', type: 'PDF', pages: 100, author: 'Nutrition Society', description: 'Everything about balanced nutrition', downloadCount: 289000 },
  { id: 'hd12', title: 'Meal Planning Templates', category: 'Nutrition', type: 'Guide', pages: 20, author: 'Dr. Maria Santos', description: 'Weekly meal planning made easy', downloadCount: 345000 },
  { id: 'hd13', title: 'Food & Drug Interactions', category: 'Nutrition', type: 'PDF', pages: 35, author: 'PharmaCare', description: 'Important food-medication interactions', downloadCount: 156000 },
  
  // Fitness
  { id: 'hd14', title: 'Home Exercise Program', category: 'Fitness', type: 'PDF', pages: 45, author: 'Trainer Alex Turner', description: 'Complete home workout guide', downloadCount: 456000 },
  { id: 'hd15', title: 'Stretching & Flexibility Guide', category: 'Fitness', type: 'Guide', pages: 25, author: 'Instructor Laura Kim', description: 'Daily stretching routines', downloadCount: 234000 },
  
  // Specific Conditions
  { id: 'hd16', title: 'Hypertension Management', category: 'Cardiology', type: 'PDF', pages: 40, author: 'Dr. Robert Chen', description: 'Living with high blood pressure', downloadCount: 189000 },
  { id: 'hd17', title: 'Arthritis Exercise Guide', category: 'Orthopedics', type: 'Guide', pages: 30, author: 'Dr. Jennifer Adams', description: 'Safe exercises for joint health', downloadCount: 145000 },
  { id: 'hd18', title: 'Asthma Action Plan', category: 'Pulmonology', type: 'PDF', pages: 15, author: 'Dr. William Green', description: 'Managing asthma effectively', downloadCount: 178000 },
  
  // Preventive Care
  { id: 'hd19', title: 'Annual Health Checkup Guide', category: 'Preventive Care', type: 'Guide', pages: 20, author: 'HealthFirst', description: 'What tests you need and when', downloadCount: 345000 },
  { id: 'hd20', title: 'Vaccination Schedule for Adults', category: 'Preventive Care', type: 'PDF', pages: 10, author: 'CDC', description: 'Recommended adult immunizations', downloadCount: 234000 },
];

export const preventiveCareGuides: PreventiveCare[] = [
  {
    id: 'pc1',
    title: 'Heart Disease Prevention',
    category: 'Cardiology',
    description: 'Protect your heart with these evidence-based strategies',
    tips: [
      'Exercise at least 150 minutes per week',
      'Maintain a healthy weight',
      'Eat a heart-healthy diet rich in fruits and vegetables',
      'Limit saturated fats and sodium',
      'Quit smoking and limit alcohol',
      'Manage stress effectively',
      'Monitor blood pressure regularly',
      'Get adequate sleep (7-9 hours)'
    ],
    riskFactors: ['High blood pressure', 'High cholesterol', 'Smoking', 'Obesity', 'Diabetes', 'Family history', 'Sedentary lifestyle', 'Unhealthy diet'],
    icon: 'Heart'
  },
  {
    id: 'pc2',
    title: 'Diabetes Prevention',
    category: 'Endocrinology',
    description: 'Reduce your risk of Type 2 diabetes with lifestyle changes',
    tips: [
      'Maintain a healthy body weight',
      'Be physically active daily',
      'Eat whole grains, fruits, and vegetables',
      'Limit sugary drinks and processed foods',
      'Choose healthy fats',
      'Reduce portion sizes',
      'Monitor blood sugar if at risk',
      'Get regular health screenings'
    ],
    riskFactors: ['Overweight', 'Sedentary lifestyle', 'Family history', 'Age over 45', 'High blood pressure', 'Prediabetes', 'Gestational diabetes history'],
    icon: 'Activity'
  },
  {
    id: 'pc3',
    title: 'Cancer Prevention',
    category: 'Oncology',
    description: 'Lower your cancer risk with proven preventive measures',
    tips: [
      'Avoid tobacco in all forms',
      'Protect skin from sun exposure',
      'Eat a plant-based diet',
      'Maintain a healthy weight',
      'Exercise regularly',
      'Limit alcohol consumption',
      'Get vaccinated (HPV, Hepatitis B)',
      'Follow recommended screening schedules'
    ],
    riskFactors: ['Tobacco use', 'Sun exposure', 'Obesity', 'Family history', 'Certain infections', 'Environmental exposures', 'Poor diet', 'Sedentary lifestyle'],
    icon: 'Shield'
  },
  {
    id: 'pc4',
    title: 'Stroke Prevention',
    category: 'Neurology',
    description: 'Reduce your stroke risk with these key strategies',
    tips: [
      'Control high blood pressure',
      'Manage diabetes effectively',
      'Maintain healthy cholesterol levels',
      'Exercise regularly',
      'Eat a healthy diet',
      'Quit smoking',
      'Limit alcohol',
      'Treat atrial fibrillation if present'
    ],
    riskFactors: ['High blood pressure', 'Smoking', 'Diabetes', 'High cholesterol', 'Obesity', 'Heart disease', 'Family history', 'Age'],
    icon: 'Brain'
  },
  {
    id: 'pc5',
    title: 'Mental Health Maintenance',
    category: 'Mental Health',
    description: 'Maintain good mental health with daily practices',
    tips: [
      'Practice regular physical activity',
      'Get adequate sleep',
      'Maintain social connections',
      'Practice mindfulness or meditation',
      'Limit screen time',
      'Seek help when needed',
      'Express gratitude daily',
      'Set realistic goals'
    ],
    riskFactors: ['Chronic stress', 'Social isolation', 'Trauma history', 'Substance abuse', 'Chronic illness', 'Family history', 'Poor sleep', 'Lack of exercise'],
    icon: 'Brain'
  },
  {
    id: 'pc6',
    title: 'Bone Health',
    category: 'Orthopedics',
    description: 'Keep your bones strong and prevent osteoporosis',
    tips: [
      'Get enough calcium (1000-1200mg daily)',
      'Ensure adequate Vitamin D',
      'Do weight-bearing exercises',
      'Avoid smoking',
      'Limit alcohol and caffeine',
      'Prevent falls at home',
      'Get bone density tests if at risk',
      'Consider supplements if needed'
    ],
    riskFactors: ['Age', 'Female gender', 'Low body weight', 'Family history', 'Smoking', 'Excessive alcohol', 'Low calcium intake', 'Sedentary lifestyle'],
    icon: 'Bone'
  },
  {
    id: 'pc7',
    title: 'Respiratory Health',
    category: 'Pulmonology',
    description: 'Protect your lungs and breathe easier',
    tips: [
      'Avoid smoking and secondhand smoke',
      'Exercise regularly to strengthen lungs',
      'Avoid air pollution when possible',
      'Practice deep breathing exercises',
      'Keep indoor air clean',
      'Get flu and pneumonia vaccines',
      'Treat respiratory infections promptly',
      'Maintain good posture'
    ],
    riskFactors: ['Smoking', 'Air pollution exposure', 'Occupational hazards', 'Respiratory infections', 'Allergies', 'Family history of lung disease'],
    icon: 'Wind'
  },
  {
    id: 'pc8',
    title: 'Eye Health',
    category: 'Ophthalmology',
    description: 'Maintain good vision throughout your life',
    tips: [
      'Get regular eye exams',
      'Wear sunglasses outdoors',
      'Take screen breaks (20-20-20 rule)',
      'Eat vision-healthy foods',
      'Maintain healthy blood pressure',
      'Control diabetes if present',
      'Wear protective eyewear when needed',
      'Quit smoking'
    ],
    riskFactors: ['Age', 'Diabetes', 'High blood pressure', 'Family history', 'Smoking', 'UV exposure', 'Extended screen time'],
    icon: 'Eye'
  }
];

export const healthcareCategories = [
  { id: 'firstaid', name: 'First Aid', icon: '🏥', color: '#EF4444' },
  { id: 'cardiology', name: 'Heart Health', icon: '❤️', color: '#DC2626' },
  { id: 'mentalhealth', name: 'Mental Health', icon: '🧠', color: '#8B5CF6' },
  { id: 'nutrition', name: 'Nutrition', icon: '🥗', color: '#10B981' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: '#F59E0B' },
  { id: 'pediatrics', name: 'Children\'s Health', icon: '👶', color: '#EC4899' },
  { id: 'womenshealth', name: 'Women\'s Health', icon: '👩', color: '#F472B6' },
  { id: 'prevention', name: 'Prevention', icon: '🛡️', color: '#3B82F6' },
];
