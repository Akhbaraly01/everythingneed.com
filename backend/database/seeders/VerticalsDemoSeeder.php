<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\BuildingServices\Entities\BuildingServiceBooking;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Food\Entities\FoodOrder;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Vendors\Entities\Vendor;

/**
 * W10 verticals demo data: needs requests + offers, a food order, a
 * building booking with real workers, and an agriculture vendor so the
 * needs/food/building/agriculture surfaces are never empty on a fresh
 * install. Idempotent (DEMO: / NR-DEMO / FO-DEMO markers).
 */
class VerticalsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        $plumberUser = User::where('email', 'daniel.worker@everythingneed.com')->first();
        $electricUser = User::where('email', 'grace.worker@everythingneed.com')->first();

        if ($customer && $plumberUser && $electricUser) {
            $this->seedBuildingWorkers($plumberUser, $electricUser);
            $this->seedBuildingBooking($customer, $plumberUser);
            $this->seedNeeds($customer, $plumberUser, $electricUser);
        }

        if ($customer) {
            $this->seedFoodOrder($customer);
        }

        $this->seedFarmer();
    }

    private function seedBuildingWorkers(User $plumberUser, User $electricUser): void
    {
        ServiceWorker::firstOrCreate(
            ['user_id' => $plumberUser->id],
            [
                'full_name' => $plumberUser->name,
                'phone' => '0244000001',
                'worker_type' => 'plumber',
                'is_available' => true,
            ]
        );

        ServiceWorker::firstOrCreate(
            ['user_id' => $electricUser->id],
            [
                'full_name' => $electricUser->name,
                'phone' => '0244000002',
                'worker_type' => 'electrician',
                'is_available' => true,
            ]
        );
    }

    private function seedBuildingBooking(User $customer, User $plumberUser): void
    {
        $worker = ServiceWorker::where('user_id', $plumberUser->id)->first();
        if (!$worker) {
            return;
        }

        BuildingServiceBooking::firstOrCreate(
            ['description' => 'DEMO: Replace burst pipe under kitchen sink'],
            [
                'user_id' => $customer->id,
                'worker_id' => $worker->id,
                'worker_type' => 'plumber',
                'service_category' => 'plumbing',
                'address' => '12 Ring Road, Accra',
                'scheduled_date' => now()->addDays(5)->toDateString(),
                'scheduled_time' => '09:00',
                'estimated_cost' => 250,
                'quoted_price' => 180,
                'status' => 'confirmed',
                'notes' => 'DEMO: waiting-area access from 08:30.',
            ]
        );
    }

    private function seedNeeds(User $customer, User $providerA, User $providerB): void
    {
        $categoryId = \DB::table('need_categories')
            ->where('slug', 'building-services')
            ->value('id');

        $open = NeedRequest::firstOrCreate(
            ['request_number' => 'NR-DEMO-SINK'],
            [
                'user_id' => $customer->id,
                'category_id' => $categoryId,
                'title' => 'DEMO: Fix leaking kitchen sink',
                'description' => 'DEMO: Slow leak under the sink, needs a plumber this week.',
                'budget_min' => 60,
                'budget_max' => 120,
                'location' => 'Accra',
                'status' => NeedRequest::STATUS_OFFERED,
                'deadline' => now()->addDays(7)->toDateString(),
            ]
        );

        NeedOffer::firstOrCreate(
            ['need_request_id' => $open->id, 'provider_id' => $providerA->id],
            [
                'price' => 95,
                'message' => 'DEMO: I can come Thursday morning.',
                'status' => NeedOffer::STATUS_PENDING,
            ]
        );

        $active = NeedRequest::firstOrCreate(
            ['request_number' => 'NR-DEMO-FARM'],
            [
                'user_id' => $customer->id,
                'category_id' => $categoryId,
                'title' => 'DEMO: Set up drip irrigation for vegetable beds',
                'description' => 'DEMO: Two beds, roughly 80m of tubing.',
                'budget_min' => 250,
                'budget_max' => 400,
                'location' => 'Kumasi',
                'status' => NeedRequest::STATUS_IN_PROGRESS,
                'deadline' => now()->addDays(14)->toDateString(),
            ]
        );

        NeedOffer::firstOrCreate(
            ['need_request_id' => $active->id, 'provider_id' => $providerB->id],
            [
                'price' => 300,
                'message' => 'DEMO: Materials included.',
                'status' => NeedOffer::STATUS_ACCEPTED,
            ]
        );
    }

    private function seedFoodOrder(User $customer): void
    {
        $restaurantId = \DB::table('restaurants')->value('id');
        $menuItem = \DB::table('menu_items')->where('restaurant_id', $restaurantId)->first();
        // Server-computed totals (PlaceFoodOrder): items only, fee separate.
        $itemsTotal = $menuItem ? round((float) $menuItem->price * 2, 2) : 0;

        $order = FoodOrder::firstOrCreate(
            ['order_number' => 'FO-DEMO-1'],
            [
                'user_id' => $customer->id,
                'restaurant_id' => $restaurantId,
                'delivery_address' => '12 Ring Road, Accra',
                'total_amount' => $itemsTotal,
                'status' => FoodOrder::STATUS_PREPARING,
                'delivery_fee' => 5,
                'estimated_delivery_time' => now()->addMinutes(45),
            ]
        );

        if ($menuItem) {
            // Keep the demo total in sync with the menu price (idempotent).
            FoodOrder::where('id', $order->id)->update(['total_amount' => $itemsTotal]);
        }

        if ($menuItem) {
            $hasItem = \DB::table('food_order_items')
                ->where('order_id', $order->id)
                ->where('menu_item_id', $menuItem->id)
                ->exists();

            if (!$hasItem) {
                \DB::table('food_order_items')->insert([
                    'id' => (string) Str::uuid(),
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => 2,
                    'unit_price' => $menuItem->price,
                ]);
            }
        }
    }

    private function seedFarmer(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'kojo.farmer@everythingneed.com'],
            [
                'name' => 'Kojo Organic Farms',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        UserRole::query()->updateOrCreate(
            ['user_id' => $user->id, 'role' => 'vendor'],
            ['category_id' => null]
        );

        Vendor::firstOrCreate(
            ['user_id' => $user->id],
            [
                'store_name' => 'Kojo Organic Farms',
                'category' => 'agriculture',
                'is_verified' => true,
            ]
        );
    }
}
