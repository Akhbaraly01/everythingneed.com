<?php

namespace Tests\Feature\Architecture;

use Tests\TestCase;

/**
 * Phase 3: domain isolation ratchet.
 *
 * A module's logic layers (Actions, Http, Services, Requests, Routes,
 * Providers, Listeners, Policies) may reference other domains ONLY through
 * Core contracts or the signed event channel — never another module's
 * Entities/Services/Actions/Http directly.
 *
 * Always allowed (not listed here): same-module references, Core/*, App/*,
 * any module's Events/* layer (sanctioned channel, signed in Phase 4),
 * and Entities<->Entities references (Eloquent relations).
 *
 * Grandfathered violations below are load-bearing (row locks, money paths)
 * and migrate one by one to Core contracts. The list only shrinks: unknown
 * references fail, and stale entries (fixed but not removed) fail too.
 * Regenerate with: php scripts/scan-module-deps.php --allowlist
 */
class ModuleDependencyTest extends TestCase
{
    private const ALLOWLIST = [
        'Modules/Admin/Http/Controllers/AdminBrandController.php' => ['Modules\Products\Entities'],
        'Modules/Admin/Http/Controllers/AdminCostGuideController.php' => ['Modules\Needs\Entities'],
        'Modules/Admin/Http/Controllers/AdminNeedsController.php' => ['Modules\Needs\Entities', 'Modules\Needs\Http', 'Modules\Needs\Services', 'Modules\Orders\Entities'],
        'Modules/Admin/Http/Controllers/AdminSupportController.php' => ['Modules\Messaging\Entities'],
        'Modules/Admin/Routes/api.php' => ['Modules\Orders\Http'],
        'Modules/Admin/Services/Cms/BlockResolver.php' => ['Modules\BuildingServices\Entities', 'Modules\Categories\Entities', 'Modules\Healthcare\Entities', 'Modules\Learn\Entities', 'Modules\Needs\Entities', 'Modules\Products\Entities', 'Modules\Vendors\Entities'],
        'Modules/Bills/Actions/PurchaseBill.php' => ['Modules\Payments\Entities'],
        // Vendor owns the service a booking was made against (vendor_service
        // lifecycle) - relation traversal for authorization, same pattern as
        // NeedController => Vendors\Entities and FlightController => Bookings.
        'Modules/Bookings/Http/Controllers/BookingController.php' => ['Modules\Vendors\Entities'],
        'Modules/Checkout/Http/Controllers/CartController.php' => ['Modules\Inventory\Entities', 'Modules\Pharmacy\Entities', 'Modules\Products\Entities'],
        'Modules/Delivery/Http/Controllers/DeliveryController.php' => ['Modules\Orders\Entities'],
        // Saved-jobs snapshots: engagement's own read model, batched by type.
        'Modules/Engagement/Http/Controllers/EngagementController.php' => ['Modules\Products\Entities', 'Modules\Jobs\Entities', 'Modules\RealEstate\Entities'],
        'Modules/Experts/Http/Controllers/ExpertController.php' => ['Modules\Payments\Services'],
        'Modules/Healthcare/Actions/CompleteConsultation.php' => ['Modules\Pharmacy\Entities'],
        'Modules/Healthcare/Http/Controllers/AidController.php' => ['Modules\Payments\Services'],
        'Modules/Healthcare/Http/Controllers/AppointmentController.php' => ['Modules\Payments\Services'],
        'Modules/Healthcare/Http/Controllers/DoctorController.php' => ['Modules\Experts\Entities'],
        'Modules/Healthcare/Http/Controllers/LabController.php' => ['Modules\Payments\Services'],
        'Modules/Hotels/Http/Controllers/HotelController.php' => ['Modules\Payments\Services'],
        'Modules/Inventory/Http/Controllers/StockController.php' => ['Modules\Products\Entities', 'Modules\Vendors\Entities'],
        'Modules/Learn/Actions/IssueCertificate.php' => ['Modules\Users\Entities'],
        'Modules/Learn/Http/Controllers/LessonProgressController.php' => ['Modules\Users\Entities'],
        'Modules/Messaging/Http/Controllers/ChatController.php' => ['Modules\Needs\Entities'],
        'Modules/Needs/Http/Controllers/NeedController.php' => ['Modules\Products\Entities', 'Modules\Vendors\Entities'],
        'Modules/Needs/Http/Controllers/NeedRequestController.php' => ['Modules\Payments\Entities'],
        'Modules/Orders/Actions/PlaceOrder.php' => ['Modules\Pharmacy\Entities'],
        'Modules/Orders/Actions/PlaceProductOrder.php' => ['Modules\Checkout\Entities', 'Modules\Inventory\Entities', 'Modules\Products\Entities'],
        'Modules/Orders/Http/Controllers/DisputeController.php' => ['Modules\Needs\Entities'],
        'Modules/Orders/Http/Controllers/ProductOrderController.php' => ['Modules\Payments\Actions', 'Modules\Payments\Entities', 'Modules\Products\Entities', 'Modules\Vendors\Entities'],
        'Modules/Orders/Http/Controllers/ReturnRequestController.php' => ['Modules\Payments\Actions', 'Modules\Payments\Entities'],
        'Modules/Payments/Actions/ChargePayment.php' => ['Modules\Orders\Entities'],
        'Modules/Payments/Actions/RefundPayment.php' => ['Modules\Orders\Entities', 'Modules\Products\Entities'],
        'Modules/Payments/Listeners/UpdateOrderStatus.php' => ['Modules\Orders\Entities'],
        'Modules/Pharmacy/Actions/PlacePharmacyOrder.php' => ['Modules\Orders\Entities'],
        'Modules/Pharmacy/Http/Controllers/PharmacyAdminController.php' => ['Modules\Orders\Entities'],
        'Modules/Pharmacy/Http/Controllers/PharmacyOrderController.php' => ['Modules\Orders\Entities'],
        'Modules/Pharmacy/Http/Controllers/PrescriptionController.php' => ['Modules\Orders\Entities'],
        'Modules/Products/Http/Controllers/ProductController.php' => ['Modules\Engagement\Entities', 'Modules\Vendors\Entities'],
        'Modules/Products/Http/Requests/StoreProductRequest.php' => ['Modules\Vendors\Entities'],
        // Hotel reviews (N-40) read the hotel row for existence + a
        // completed-stay check that computes the verified-guest badge.
        'Modules/Reviews/Http/Controllers/ReviewController.php' => ['Modules\Hotels\Entities', 'Modules\Learn\Entities', 'Modules\Needs\Entities', 'Modules\Orders\Entities'],
        'Modules/Rides/Http/Controllers/FlightController.php' => ['Modules\Bookings\Entities'],
        'Modules/Services/Http/Controllers/AdminServiceController.php' => ['Modules\Payments\Services'],
        'Modules/Services/Http/Controllers/ServiceCatalogController.php' => ['Modules\Payments\Services'],
        'Modules/Upload/Http/Controllers/UploadController.php' => ['Modules\Admin\Entities'],
        'Modules/Vendors/Http/Controllers/VendorWorkspaceController.php' => ['Modules\Bookings\Entities', 'Modules\Products\Entities'],
    ];

    public function test_cross_module_logic_references_stay_within_allowlist(): void
    {
        $found = $this->scan();
        $violations = [];

        foreach ($found as $file => $refs) {
            foreach (array_unique($refs) as $ref) {
                if (!in_array($ref, self::ALLOWLIST[$file] ?? [], true)) {
                    $violations[] = "NEW cross-module reference: {$file} => {$ref} (migrate to a Core contract or the event channel)";
                }
            }
        }

        foreach (self::ALLOWLIST as $file => $refs) {
            foreach ($refs as $ref) {
                if (!in_array($ref, $found[$file] ?? [], true)) {
                    $violations[] = "STALE allowlist entry (already fixed — remove it): {$file} => {$ref}";
                }
            }
        }

        $this->assertSame([], $violations, "Module boundary drift:\n" . implode("\n", $violations));
    }

    /** @return array<string, list<string>> file => foreign module layers */
    private function scan(): array
    {
        $found = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(base_path('Modules'), \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $relative = str_replace('\\', '/', str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file->getPathname()));
            $parts = explode('/', $relative);
            $module = $parts[1] ?? '';
            $inEntities = ($parts[2] ?? '') === 'Entities';
            $code = (string) file_get_contents($file->getPathname());

            if (!preg_match_all('/Modules\\\\([A-Za-z0-9_]+)\\\\([A-Za-z0-9_]+)/', $code, $matches, PREG_SET_ORDER)) {
                continue;
            }

            foreach ($matches as $match) {
                [, $other, $layer] = $match;
                if ($other === $module) {
                    continue;
                }
                if ($layer === 'Events') {
                    continue;
                }
                if ($inEntities && $layer === 'Entities') {
                    continue;
                }
                $found[$relative][] = "Modules\\{$other}\\{$layer}";
            }
        }

        ksort($found);

        return $found;
    }
}
