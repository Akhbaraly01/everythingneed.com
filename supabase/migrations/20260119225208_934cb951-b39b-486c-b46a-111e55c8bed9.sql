-- Add more sample doctors with different specializations
INSERT INTO public.doctors (full_name, specialization, qualification, experience_years, consultation_fee, virtual_fee, rating, is_available)
VALUES 
  ('Dr. Michael Thompson', 'Cardiology', 'MD, FACC, Board Certified Cardiologist', 18, 180, 126, 4.9, true),
  ('Dr. Priya Patel', 'Dermatology', 'MD, FAAD, Dermatology Specialist', 12, 120, 84, 4.8, true),
  ('Dr. James Wilson', 'Orthopedics', 'MD, MS Orthopedics, Sports Medicine', 20, 200, 140, 4.9, true),
  ('Dr. Sarah Chen', 'Pediatrics', 'MD, FAAP, Pediatric Specialist', 15, 100, 70, 4.9, true),
  ('Dr. Robert Garcia', 'Neurology', 'MD, PhD, Board Certified Neurologist', 22, 220, 154, 4.8, true),
  ('Dr. Emily Brown', 'Gynecology', 'MD, FACOG, OB/GYN Specialist', 16, 150, 105, 4.9, true),
  ('Dr. David Kim', 'Psychiatry', 'MD, Board Certified Psychiatrist', 14, 160, 112, 4.8, true),
  ('Dr. Lisa Anderson', 'Ophthalmology', 'MD, FACS, Eye Specialist', 19, 140, 98, 4.7, true),
  ('Dr. Ahmed Hassan', 'Gastroenterology', 'MD, FACG, GI Specialist', 17, 170, 119, 4.8, true),
  ('Dr. Jennifer Lopez', 'Endocrinology', 'MD, FACE, Diabetes Specialist', 13, 160, 112, 4.9, true),
  ('Dr. William Davis', 'Pulmonology', 'MD, FCCP, Lung Specialist', 21, 180, 126, 4.7, true),
  ('Dr. Maria Santos', 'Rheumatology', 'MD, FACR, Rheumatology Expert', 15, 150, 105, 4.8, true),
  ('Dr. John Mitchell', 'Urology', 'MD, FACS, Urological Surgeon', 18, 190, 133, 4.8, true),
  ('Dr. Amanda White', 'Allergy & Immunology', 'MD, FAAAAI, Allergy Specialist', 11, 130, 91, 4.9, true),
  ('Dr. Christopher Lee', 'General Surgery', 'MD, FACS, General Surgeon', 23, 200, 140, 4.7, true),
  ('Dr. Rachel Green', 'Family Medicine', 'MD, FAAFP, Family Physician', 10, 80, 56, 4.9, true),
  ('Dr. Kevin Park', 'ENT', 'MD, FACS, ENT Specialist', 14, 140, 98, 4.8, true),
  ('Dr. Nicole Taylor', 'Nephrology', 'MD, FASN, Kidney Specialist', 16, 170, 119, 4.8, true),
  ('Dr. Brian Johnson', 'Oncology', 'MD, FACP, Cancer Specialist', 20, 250, 175, 4.9, true),
  ('Dr. Stephanie Moore', 'Physical Medicine', 'MD, FAAPMR, Rehabilitation Specialist', 12, 120, 84, 4.7, true)
ON CONFLICT DO NOTHING;