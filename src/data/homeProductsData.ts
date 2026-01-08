export interface HomeProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  vendor: string;
  description: string;
}

const categories = [
  'Electronics', 'Fashion', 'Food', 'Health', 'Home', 'Sports', 'Books', 
  'Beauty', 'Auto', 'Garden', 'Pets', 'Baby', 'Toys', 'Office', 'Music',
  'Gaming', 'Travel', 'Jewelry', 'Art', 'Crafts'
];

const productNames: Record<string, string[]> = {
  Electronics: ['Smartphone Pro', 'Laptop Ultra', 'Tablet Air', 'Smart Watch', 'Wireless Earbuds', 'Bluetooth Speaker', 'Power Bank', 'USB Hub', 'Webcam HD', 'Monitor 4K'],
  Fashion: ['Designer Jacket', 'Premium Jeans', 'Silk Dress', 'Leather Belt', 'Cotton Shirt', 'Wool Sweater', 'Running Shoes', 'Formal Suit', 'Summer Hat', 'Winter Coat'],
  Food: ['Organic Coffee', 'Premium Tea', 'Gourmet Chocolate', 'Olive Oil', 'Spice Set', 'Protein Bars', 'Energy Drinks', 'Dried Fruits', 'Nut Mix', 'Honey Jar'],
  Health: ['Vitamins Pack', 'Protein Powder', 'First Aid Kit', 'Blood Pressure Monitor', 'Thermometer', 'Massage Gun', 'Yoga Mat', 'Resistance Bands', 'Foam Roller', 'Supplements'],
  Home: ['Air Purifier', 'Robot Vacuum', 'Coffee Maker', 'Blender Pro', 'Air Fryer', 'Instant Pot', 'Smart Light', 'Security Camera', 'Door Lock', 'Thermostat'],
  Sports: ['Basketball', 'Tennis Racket', 'Golf Set', 'Yoga Ball', 'Dumbbells', 'Jump Rope', 'Boxing Gloves', 'Cycling Helmet', 'Running Belt', 'Sports Bag'],
  Books: ['Business Guide', 'Fiction Novel', 'Self-Help Book', 'Cooking Book', 'History Book', 'Science Book', 'Art Book', 'Travel Guide', 'Biography', 'Poetry Collection'],
  Beauty: ['Skincare Set', 'Makeup Kit', 'Hair Dryer', 'Electric Shaver', 'Perfume', 'Face Mask', 'Nail Set', 'Lip Care', 'Eye Cream', 'Body Lotion'],
  Auto: ['Car Charger', 'Dash Camera', 'Seat Cover', 'Floor Mats', 'Phone Mount', 'Air Freshener', 'Tool Kit', 'Jump Starter', 'Tire Pump', 'Car Vacuum'],
  Garden: ['Plant Pot', 'Garden Tools', 'Lawn Mower', 'Sprinkler', 'Fertilizer', 'Seeds Pack', 'Gloves', 'Pruning Shears', 'Hose', 'Solar Lights'],
  Pets: ['Dog Food', 'Cat Tree', 'Pet Bed', 'Leash', 'Pet Toys', 'Grooming Kit', 'Carrier Bag', 'Water Fountain', 'Training Pads', 'Pet Camera'],
  Baby: ['Baby Monitor', 'Stroller', 'Car Seat', 'High Chair', 'Diaper Bag', 'Baby Clothes', 'Toys Set', 'Bottle Warmer', 'Crib', 'Baby Gate'],
  Toys: ['LEGO Set', 'Remote Car', 'Board Game', 'Puzzle Set', 'Action Figure', 'Doll House', 'Building Blocks', 'Art Set', 'Science Kit', 'Card Game'],
  Office: ['Desk Chair', 'Monitor Stand', 'Keyboard', 'Mouse', 'Desk Lamp', 'File Cabinet', 'Whiteboard', 'Planner', 'Stapler', 'Calculator'],
  Music: ['Guitar', 'Keyboard', 'Drum Kit', 'Microphone', 'Headphones', 'Speaker', 'Music Stand', 'Tuner', 'Cables', 'Amp'],
  Gaming: ['Gaming Console', 'Gaming Mouse', 'Gaming Keyboard', 'Gaming Chair', 'Controller', 'VR Headset', 'Gaming Monitor', 'Headset', 'Capture Card', 'Gaming Desk'],
  Travel: ['Suitcase', 'Backpack', 'Travel Pillow', 'Luggage Lock', 'Packing Cubes', 'Travel Adapter', 'Toiletry Bag', 'Passport Holder', 'Eye Mask', 'Compression Bags'],
  Jewelry: ['Gold Necklace', 'Silver Ring', 'Diamond Earrings', 'Pearl Bracelet', 'Watch', 'Brooch', 'Pendant', 'Cufflinks', 'Anklet', 'Chain'],
  Art: ['Canvas Set', 'Paint Set', 'Brushes', 'Easel', 'Sketchbook', 'Pencils', 'Markers', 'Clay', 'Art Prints', 'Frame'],
  Crafts: ['Sewing Machine', 'Yarn', 'Knitting Needles', 'Fabric', 'Scissors', 'Glue Gun', 'Beads', 'Thread', 'Ribbons', 'Embroidery Kit']
};

const images = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=300',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300',
];

const vendors = ['TechHub', 'StyleMart', 'HomeGoods', 'FreshMarket', 'SportZone', 'BookWorld', 'BeautyPlus', 'AutoCare', 'PetLovers', 'BabyJoy'];

const getDescription = (name: string, category: string): string => {
  return `High-quality ${name.toLowerCase()} from our ${category} collection. Premium materials, excellent craftsmanship, and backed by our satisfaction guarantee. Perfect for everyday use with modern design.`;
};

export const generateHomeProducts = (): HomeProduct[] => {
  const products: HomeProduct[] = [];
  let id = 1;
  
  // Generate ~50 products per category to get 1000+
  for (let round = 0; round < 5; round++) {
    for (const category of categories) {
      const names = productNames[category] || productNames.Electronics;
      for (const name of names) {
        const price = Math.floor(Math.random() * 1000) + 10;
        const hasDiscount = Math.random() > 0.5;
        products.push({
          id: id++,
          name: round > 0 ? `${name} ${round + 1}` : name,
          category,
          price,
          originalPrice: hasDiscount ? Math.floor(price * (1.2 + Math.random() * 0.5)) : undefined,
          rating: Number((4 + Math.random()).toFixed(1)),
          image: images[Math.floor(Math.random() * images.length)],
          vendor: vendors[Math.floor(Math.random() * vendors.length)],
          description: getDescription(name, category),
        });
      }
    }
  }
  
  return products;
};

export const allHomeProducts = generateHomeProducts();
