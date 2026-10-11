<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('categories')->count() === 0) {
            $this->seedCategories();
        }
        if (DB::table('hotels')->count() === 0) {
            $this->seedHotels();
        }
        if (DB::table('properties')->count() === 0) {
            $this->seedProperties();
        }
        // W5: job board moved to JobsDemoSeeder (local listings + repair
        // of the foreign rows this file used to plant).
        if (DB::table('restaurants')->count() === 0) {
            $this->seedRestaurants();
        }
        if (DB::table('courses')->count() === 0) {
            $this->seedCourses();
        }
        if (DB::table('need_categories')->count() === 0) {
            $this->seedNeedCategories();
        }
        if (DB::table('medicines')->count() === 0) {
            $this->seedMedicines();
        }
        if (DB::table('health_content')->count() === 0) {
            $this->seedHealthContent();
        }
        if (DB::table('need_items')->count() === 0) {
            $this->seedNeedItems();
        }
        $this->seedAgricultureProducts();
        if (DB::table('flights')->count() === 0) {
            $this->seedFlights();
        }
    }

    private function seedFlights(): void
    {
        $now = now();

        $flights = [
            // number, airline, from, fromCode, to, toCode, dep, arr, duration, price, days
            ['EN-101', 'EverythingAir', 'New York', 'JFK', 'Miami', 'MIA', '07:30', '10:45', 195, 129.00, [1,2,3,4,5]],
            ['EN-102', 'EverythingAir', 'Miami', 'MIA', 'New York', 'JFK', '18:00', '21:20', 200, 119.00, [1,2,3,4,5,6]],
            ['EN-201', 'EverythingAir', 'Chicago', 'ORD', 'Denver', 'DEN', '09:15', '11:05', 170, 98.00, [0,1,2,3,4,5,6]],
            ['EN-202', 'EverythingAir', 'Denver', 'DEN', 'Los Angeles', 'LAX', '13:40', '15:05', 145, 89.00, [1,3,5,6]],
            ['EN-301', 'SkyLink', 'Los Angeles', 'LAX', 'Honolulu', 'HNL', '08:00', '11:25', 325, 249.00, [2,5]],
            ['EN-302', 'SkyLink', 'Honolulu', 'HNL', 'Los Angeles', 'LAX', '14:30', '22:10', 330, 239.00, [3,6]],
        ];

        foreach ($flights as [$number, $airline, $fromCity, $fromCode, $toCity, $toCode, $dep, $arr, $duration, $price, $days]) {
            DB::table('flights')->insert([
                'id' => Str::uuid(),
                'flight_number' => $number,
                'airline' => $airline,
                'origin_city' => $fromCity,
                'origin_code' => $fromCode,
                'destination_city' => $toCity,
                'destination_code' => $toCode,
                'departure_time' => $dep,
                'arrival_time' => $arr,
                'duration_minutes' => $duration,
                'price' => $price,
                'seats_total' => 180,
                'seats_available' => rand(12, 180),
                'days_of_week' => json_encode($days),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function seedAgricultureProducts(): void
    {
        $vendor = DB::table('vendors')->first();

        if (!$vendor) {
            return;
        }

        $now = now();
        $products = [
            ['Organic Compost (50kg bag)', 'Nutrient-rich compost for vegetable gardens.', 'agriculture', 12.00, 120],
            ['Hybrid Maize Seeds (5kg)', 'High-yield drought-resistant maize seed.', 'agriculture', 18.50, 200],
            ['Knapsack Sprayer 16L', 'Manual shoulder sprayer for crops.', 'agriculture', 32.00, 45],
            ['Drip Irrigation Starter Kit', 'Covers up to 100m² of planted rows.', 'agriculture', 89.00, 25],
            ['Dairy Goat Milk (per litre)', 'Fresh farm milk, collected daily.', 'agriculture', 2.80, 300],
        ];

        foreach ($products as [$name, $description, $category, $price, $stock]) {
            DB::table('products')->insert([
                'id' => Str::uuid(),
                'vendor_id' => $vendor->id,
                'name' => $name,
                'description' => $description,
                'category' => $category,
                'price' => $price,
                'stock_quantity' => $stock,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function seedNeedItems(): void
    {
        $categories = DB::table('need_categories')->get()->keyBy('slug');
        $now = now();

        $items = [
            ['cleaning', 'Standard Home Cleaning', 'Full-home cleaning: floors, kitchen, bathrooms.', 45.00],
            ['cleaning', 'Deep Cleaning Package', 'Intensive clean incl. windows and appliances.', 90.00],
            ['transportation', 'Local Moving Help', 'Two movers with van for local moves.', 60.00],
            ['building-services', 'Handyman Visit (2h)', 'General repairs and installations.', 40.00],
            ['home-cleaning', 'Office Cleaning (per visit)', 'After-hours office cleaning service.', 75.00],
            ['tutoring', 'Math Tutoring Session', 'One-on-one session, all levels.', 25.00],
            ['event-planning', 'Birthday Party Setup', 'Decoration and setup for home parties.', 55.00],
            ['tech-support', 'PC Setup & Tune-up', 'System setup, updates and optimisation.', 35.00],
        ];

        $insert = [];
        foreach ($items as [$slug, $name, $description, $price]) {
            $category = $categories->get($slug);
            if (!$category) continue;

            $insert[] = [
                'id' => Str::uuid(),
                'category_id' => $category->id,
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'is_available' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($insert !== []) {
            DB::table('need_items')->insert($insert);
        }
    }

    private function seedCategories(): void
    {
        $cats = [
            ['id'=>Str::uuid(),'name'=>'Electronics','slug'=>'electronics','description'=>'Gadgets and tech','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Clothing','slug'=>'clothing','description'=>'Fashion and apparel','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Home & Garden','slug'=>'home-garden','description'=>'Home improvement','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Sports','slug'=>'sports','description'=>'Sports equipment','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Books','slug'=>'books','description'=>'Books and materials','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Health & Beauty','slug'=>'health-beauty','description'=>'Health and beauty','is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
        ];
        DB::table('categories')->insert($cats);
    }

    private function seedHotels(): void
    {
        $hotels = [
            ['id'=>Str::uuid(),'name'=>'Accra Grand Hotel','address'=>'14 Independence Ave','city'=>'Accra','state'=>'GR','country'=>'GH','star_rating'=>5,'description'=>'Luxury 5-star hotel in Osu, Accra.','amenities'=>json_encode(['WiFi','Pool','Spa','Gym']),'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Kumasi Royal Resort','address'=>'22 Prempeh Rd','city'=>'Kumasi','state'=>'AH','country'=>'GH','star_rating'=>4,'description'=>'Garden resort near the Manhyia Palace.','amenities'=>json_encode(['WiFi','Pool','Spa','Gym']),'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Takoradi Beach Lodge','address'=>'7 Beach Rd','city'=>'Takoradi','state'=>'WR','country'=>'GH','star_rating'=>4,'description'=>'Relaxed beachfront lodge on the Atlantic.','amenities'=>json_encode(['WiFi','Beach','Spa','Pool']),'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Cape Coast Castle View Inn','address'=>'3 Castle Dr','city'=>'Cape Coast','state'=>'CR','country'=>'GH','star_rating'=>3,'description'=>'Heritage inn minutes from the Castle.','amenities'=>json_encode(['WiFi','Breakfast','Gym']),'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Tamale Savannah Lodge','address'=>'9 Dagomba Ave','city'=>'Tamale','state'=>'NR','country'=>'GH','star_rating'=>3,'description'=>'Comfortable lodge in the northern savannah.','amenities'=>json_encode(['WiFi','Pool','Restaurant']),'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
        ];
        foreach ($hotels as $h) {
            $hid = $h['id'];
            DB::table('hotels')->insert($h);
            DB::table('hotel_rooms')->insert([
                ['id'=>Str::uuid(),'hotel_id'=>$hid,'room_type'=>'standard','price_per_night'=>150,'currency'=>'USD','capacity'=>2,'is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
                ['id'=>Str::uuid(),'hotel_id'=>$hid,'room_type'=>'deluxe','price_per_night'=>225,'currency'=>'USD','capacity'=>2,'is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
                ['id'=>Str::uuid(),'hotel_id'=>$hid,'room_type'=>'suite','price_per_night'=>375,'currency'=>'USD','capacity'=>4,'is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
            ]);
        }
    }

    private function seedProperties(): void
    {
        $uid = DB::table('users')->first()->id;
        DB::table('properties')->insert([
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Modern Apartment','description'=>'2-bedroom with city views.','price'=>350000,'property_type'=>'buy','bedrooms'=>2,'bathrooms'=>2,'area_sqft'=>1200,'address'=>'100 1st Ave','city'=>'New York','state'=>'NY','country'=>'US','created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Cozy Studio','description'=>'Affordable studio near campus.','price'=>1200,'property_type'=>'rent','bedrooms'=>0,'bathrooms'=>1,'area_sqft'=>450,'address'=>'200 Campus Rd','city'=>'Austin','state'=>'TX','country'=>'US','created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Family Home','description'=>'4-bedroom with garden.','price'=>520000,'property_type'=>'buy','bedrooms'=>4,'bathrooms'=>3,'area_sqft'=>2800,'address'=>'300 Oak Ln','city'=>'Portland','state'=>'OR','country'=>'US','created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Luxury Penthouse','description'=>'Penthouse with panoramic views.','price'=>1200000,'property_type'=>'buy','bedrooms'=>3,'bathrooms'=>3,'area_sqft'=>3500,'address'=>'400 Sky Way','city'=>'Miami','state'=>'FL','country'=>'US','created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Office Space','description'=>'Modern office in business district.','price'=>2800,'property_type'=>'rent','bedrooms'=>0,'bathrooms'=>2,'area_sqft'=>2000,'address'=>'500 Market St','city'=>'San Francisco','state'=>'CA','country'=>'US','created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'title'=>'Beachfront Cottage','description'=>'Cottage with beach access.','price'=>1800,'property_type'=>'rent','bedrooms'=>2,'bathrooms'=>1,'area_sqft'=>900,'address'=>'600 Shore Dr','city'=>'Malibu','state'=>'CA','country'=>'US','created_at'=>now(),'updated_at'=>now()],
        ]);
    }

    private function seedRestaurants(): void
    {
        $uid = DB::table('users')->first()->id;
        $rests = [
            ['id'=>Str::uuid(),'user_id'=>$uid,'name'=>'Bella Italia','cuisine_type'=>'Italian','description'=>'Authentic Italian cuisine.','address'=>'101 Pasta Lane','city'=>'New York','rating'=>4.7,'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'name'=>'Sakura Japanese','cuisine_type'=>'Japanese','description'=>'Fresh sushi and dishes.','address'=>'202 Sushi St','city'=>'San Francisco','rating'=>4.5,'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'user_id'=>$uid,'name'=>'Taco Fiesta','cuisine_type'=>'Mexican','description'=>'Authentic Mexican food.','address'=>'303 Taco Ave','city'=>'Los Angeles','rating'=>4.3,'is_active'=>true,'created_at'=>now(),'updated_at'=>now()],
        ];
        foreach ($rests as $r) {
            $rid = $r['id'];
            DB::table('restaurants')->insert($r);
            DB::table('menu_items')->insert([
                ['id'=>Str::uuid(),'restaurant_id'=>$rid,'name'=>'Signature Dish','description'=>'Chef special','price'=>18.99,'category'=>'mains','is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
                ['id'=>Str::uuid(),'restaurant_id'=>$rid,'name'=>'House Salad','description'=>'Fresh garden salad','price'=>8.99,'category'=>'starters','is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
                ['id'=>Str::uuid(),'restaurant_id'=>$rid,'name'=>'Chocolate Cake','description'=>'Rich chocolate dessert','price'=>7.99,'category'=>'desserts','is_available'=>true,'created_at'=>now(),'updated_at'=>now()],
            ]);
        }
    }

    private function seedCourses(): void
    {
        $courses = [
            ['id'=>Str::uuid(),'title'=>'React Complete Guide','slug'=>'react-complete-guide','description'=>'Master React from zero to hero.','price'=>49.99,'category'=>'programming','course_type'=>'both','instructor_name'=>'John Smith','duration_hours'=>40,'is_featured'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'title'=>'Laravel Advanced','slug'=>'laravel-advanced','description'=>'Advanced Laravel patterns.','price'=>59.99,'category'=>'programming','course_type'=>'practical','instructor_name'=>'Sarah Johnson','duration_hours'=>35,'is_featured'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'title'=>'Digital Marketing','slug'=>'digital-marketing','description'=>'Complete digital marketing.','price'=>39.99,'category'=>'marketing','course_type'=>'theory','instructor_name'=>'Mike Brown','duration_hours'=>25,'is_featured'=>true,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'title'=>'Photography Basics','slug'=>'photography-basics','description'=>'Learn photography.','price'=>29.99,'category'=>'creative','course_type'=>'practical','instructor_name'=>'Emma Davis','duration_hours'=>20,'is_featured'=>false,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'title'=>'Business Management','slug'=>'business-management','description'=>'Business management skills.','price'=>44.99,'category'=>'business','course_type'=>'both','instructor_name'=>'David Wilson','duration_hours'=>30,'is_featured'=>false,'created_at'=>now(),'updated_at'=>now()],
        ];
        foreach ($courses as $c) {
            $cid = $c['id'];
            DB::table('courses')->insert($c);
            DB::table('course_lessons')->insert([
                ['id'=>Str::uuid(),'course_id'=>$cid,'title'=>'Introduction','content'=>'Welcome to the course.','lesson_order'=>1,'duration_minutes'=>15],
                ['id'=>Str::uuid(),'course_id'=>$cid,'title'=>'Getting Started','content'=>'Let us begin.','lesson_order'=>2,'duration_minutes'=>20],
                ['id'=>Str::uuid(),'course_id'=>$cid,'title'=>'Core Concepts','content'=>'Deep dive into topics.','lesson_order'=>3,'duration_minutes'=>30],
            ]);
        }
    }

    private function seedNeedCategories(): void
    {
        DB::table('need_categories')->insert([
            ['id'=>Str::uuid(),'name'=>'Transportation','slug'=>'transportation','description'=>'Moving goods and people','icon'=>'truck','color'=>'#3B82F6','sort_order'=>1,'created_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Building Services','slug'=>'building-services','description'=>'Construction and maintenance','icon'=>'hammer','color'=>'#F59E0B','sort_order'=>2,'created_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Home Cleaning','slug'=>'home-cleaning','description'=>'Cleaning and maintenance','icon'=>'sparkles','color'=>'#10B981','sort_order'=>3,'created_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Tutoring','slug'=>'tutoring','description'=>'Education and training','icon'=>'book-open','color'=>'#8B5CF6','sort_order'=>4,'created_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Event Planning','slug'=>'event-planning','description'=>'Events and celebrations','icon'=>'calendar','color'=>'#EC4899','sort_order'=>5,'created_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Tech Support','slug'=>'tech-support','description'=>'Technology assistance','icon'=>'monitor','color'=>'#6366F1','sort_order'=>6,'created_at'=>now()],
        ]);
    }

    private function seedMedicines(): void
    {
        DB::table('medicines')->insert([
            ['id'=>Str::uuid(),'name'=>'Paracetamol','generic_name'=>'Acetaminophen','category'=>'Pain Relief','description'=>'Common pain reliever and fever reducer','price'=>5.99,'requires_prescription'=>false,'stock_quantity'=>500,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Ibuprofen','generic_name'=>'Ibuprofen','category'=>'Pain Relief','description'=>'Anti-inflammatory pain reliever','price'=>7.99,'requires_prescription'=>false,'stock_quantity'=>350,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Amoxicillin','generic_name'=>'Amoxicillin','category'=>'Antibiotics','description'=>'Common antibiotic for bacterial infections','price'=>12.99,'requires_prescription'=>true,'stock_quantity'=>200,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Cetirizine','generic_name'=>'Cetirizine','category'=>'Allergy','description'=>'Antihistamine for allergy relief','price'=>8.49,'requires_prescription'=>false,'stock_quantity'=>300,'created_at'=>now(),'updated_at'=>now()],
            ['id'=>Str::uuid(),'name'=>'Omeprazole','generic_name'=>'Omeprazole','category'=>'Digestive Health','description'=>'Proton pump inhibitor for acid reflux','price'=>9.99,'requires_prescription'=>false,'stock_quantity'=>250,'created_at'=>now(),'updated_at'=>now()],
        ]);
    }

    private function seedHealthContent(): void
    {
        $now = now();
        $rows = [
            // type, title, summary, specialty, duration
            ['category','Cardiology','Heart and cardiovascular care.','Cardiology',null],
            ['category','Neurology','Brain and nervous system care.','Neurology',null],
            ['category','Orthopedics','Bones, joints and muscles.','Orthopedics',null],
            ['category','Pediatrics','Child and adolescent health.','Pediatrics',null],
            ['category','General Practice','Everyday primary care.','General Medicine',null],
            ['video','Understanding High Blood Pressure','What hypertension means and how to manage it daily.','Cardiology',8],
            ['video','Recognizing Early Stroke Signs','Learn the FAST method for early stroke detection.','Neurology',6],
            ['video','Safe Exercise After 40','Low-impact routines that protect your joints.','Orthopedics',12],
            ['document','Pre-Surgery Checklist','Everything to prepare before a scheduled procedure.','General Medicine',null],
            ['document','Managing Diabetes: A Practical Guide','Nutrition, monitoring and medication basics.','Endocrinology',null],
            ['prevention_guide','Heart Disease Prevention','Diet, activity and screening recommendations.','Cardiology',null],
            ['prevention_guide','Seasonal Flu Protection','Vaccination timing and hygiene practices.','General Medicine',null],
            ['prevention_guide','Workplace Ergonomics','Prevent back and neck strain at your desk.','Orthopedics',null],
        ];

        $insert = [];
        foreach ($rows as [$type,$title,$summary,$specialty,$duration]) {
            $insert[] = [
                'id' => Str::uuid(),
                'type' => $type,
                'title' => $title,
                'slug' => Str::slug($title),
                'summary' => $summary,
                'body' => $summary.' This content is reviewed by the EverythingNeed healthcare team.',
                'specialty' => $specialty,
                'duration_minutes' => $duration,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('health_content')->insert($insert);
    }
}
