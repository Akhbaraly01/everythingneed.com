export interface Worker {
  id: string;
  name: string;
  category: string;
  specialty: string;
  experience: string;
  rating: number;
  hourlyRate: number;
  dailyRate: number;
  available: boolean;
  verified: boolean;
  skills: string[];
  image?: string;
}

export interface BuildingCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  workers: Worker[];
}

const generateWorkers = (category: string, specialty: string, count: number): Worker[] => {
  const names = [
    "Ahmed Hassan", "Musa Ibrahim", "Chukwu Emeka", "Yusuf Bello", "Adebayo Ola",
    "Tunde Ajayi", "Kola Adeyemi", "Sani Mohammed", "Bola Okafor", "Uche Nnamdi",
    "Femi Adeleke", "Ade Johnson", "Emmanuel Obi", "Sunday Okoro", "Peter Eze",
    "James Udoh", "David Akpan", "Michael Ogunlade", "Samuel Taiwo", "Daniel Effiong"
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `${category}-${specialty}-${i + 1}`,
    name: names[i % names.length],
    category,
    specialty,
    experience: `${Math.floor(Math.random() * 15) + 2} years`,
    rating: Number((4 + Math.random()).toFixed(1)),
    hourlyRate: Math.floor(Math.random() * 50) + 10,
    dailyRate: Math.floor(Math.random() * 200) + 50,
    available: Math.random() > 0.3,
    verified: Math.random() > 0.4,
    skills: getSkillsForSpecialty(specialty),
    image: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=100&h=100&fit=crop`
  }));
};

const getSkillsForSpecialty = (specialty: string): string[] => {
  const skillsMap: Record<string, string[]> = {
    "Laborer": ["Heavy lifting", "Material transport", "Site cleanup", "Basic construction"],
    "Civil Engineer": ["Structural design", "Project management", "AutoCAD", "Site supervision"],
    "Architect": ["Building design", "3D modeling", "Space planning", "Blueprint reading"],
    "Electrician": ["Wiring", "Installations", "Troubleshooting", "Panel installation"],
    "Plumber": ["Pipe fitting", "Drainage", "Water systems", "Repairs"],
    "Carpenter": ["Woodwork", "Furniture making", "Roofing", "Door installation"],
    "Mason": ["Bricklaying", "Concrete work", "Plastering", "Tiling"],
    "Painter": ["Interior painting", "Exterior painting", "Texture finishing", "Wallpaper"],
    "Welder": ["Metal fabrication", "Structural welding", "Repair welding", "Cutting"],
    "Mechanic": ["Engine repair", "Vehicle maintenance", "Diagnostics", "Parts replacement"],
    "HVAC Technician": ["AC installation", "Heating systems", "Ventilation", "Refrigeration"],
    "Roofer": ["Roof installation", "Repairs", "Waterproofing", "Insulation"],
    "Tiler": ["Floor tiling", "Wall tiling", "Mosaic work", "Grouting"],
    "Glazier": ["Glass installation", "Window fitting", "Mirrors", "Glass cutting"],
    "Heavy Equipment Operator": ["Excavator", "Bulldozer", "Crane", "Forklift"],
  };
  return skillsMap[specialty] || ["General skills"];
};

export const buildingCategories: BuildingCategory[] = [
  {
    id: "building-construction",
    name: "Building & Construction",
    slug: "building",
    description: "Complete building services from foundation to finishing",
    icon: "Building",
    workers: [
      ...generateWorkers("building", "Laborer", 20),
      ...generateWorkers("building", "Civil Engineer", 10),
      ...generateWorkers("building", "Architect", 8),
      ...generateWorkers("building", "Mason", 15),
      ...generateWorkers("building", "Roofer", 10),
    ]
  },
  {
    id: "electrical-services",
    name: "Electrical Services",
    slug: "electrical",
    description: "All electrical installations and repairs",
    icon: "Zap",
    workers: [
      ...generateWorkers("electrical", "Electrician", 25),
      ...generateWorkers("electrical", "HVAC Technician", 12),
    ]
  },
  {
    id: "plumbing-services",
    name: "Plumbing Services",
    slug: "plumbing",
    description: "Water systems, drainage, and pipe works",
    icon: "Droplets",
    workers: generateWorkers("plumbing", "Plumber", 20),
  },
  {
    id: "carpentry-services",
    name: "Carpentry & Woodwork",
    slug: "carpentry",
    description: "Custom furniture, doors, windows, and roofing",
    icon: "Hammer",
    workers: generateWorkers("carpentry", "Carpenter", 25),
  },
  {
    id: "painting-services",
    name: "Painting & Finishing",
    slug: "painting",
    description: "Interior and exterior painting services",
    icon: "Paintbrush",
    workers: generateWorkers("painting", "Painter", 20),
  },
  {
    id: "welding-services",
    name: "Welding & Metalwork",
    slug: "welding",
    description: "Gates, railings, structural steel work",
    icon: "Flame",
    workers: generateWorkers("welding", "Welder", 18),
  },
  {
    id: "mechanic-services",
    name: "Mechanic Services",
    slug: "mechanics",
    description: "Vehicle and machinery repairs",
    icon: "Wrench",
    workers: generateWorkers("mechanics", "Mechanic", 22),
  },
  {
    id: "tiling-services",
    name: "Tiling & Flooring",
    slug: "tiling",
    description: "Floor and wall tiling installation",
    icon: "Grid3X3",
    workers: generateWorkers("tiling", "Tiler", 15),
  },
  {
    id: "glass-services",
    name: "Glass & Glazing",
    slug: "glazing",
    description: "Windows, doors, mirrors, and glass work",
    icon: "Square",
    workers: generateWorkers("glazing", "Glazier", 12),
  },
  {
    id: "heavy-equipment",
    name: "Heavy Equipment",
    slug: "equipment",
    description: "Excavators, bulldozers, cranes operators",
    icon: "Truck",
    workers: generateWorkers("equipment", "Heavy Equipment Operator", 15),
  },
  {
    id: "agriculture-workers",
    name: "Agriculture Workers",
    slug: "agriculture",
    description: "Farm hands, agricultural technicians",
    icon: "Leaf",
    workers: generateWorkers("agriculture", "Laborer", 30),
  },
];

export const getAllBuildingWorkers = (): Worker[] => {
  return buildingCategories.flatMap(cat => cat.workers);
};

export const getWorkersByCategory = (categorySlug: string): Worker[] => {
  const category = buildingCategories.find(cat => cat.slug === categorySlug);
  return category?.workers || [];
};
