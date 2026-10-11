<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Entities\DynamicModule;
use Modules\Admin\Entities\DynamicModuleEntry;

/**
 * W3: starter no-code content so the dynamic-module plane is demonstrably
 * live on a fresh install. Idempotent: modules keyed by slug, entries
 * keyed by (module, slug).
 */
class DynamicModuleSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = DynamicModule::firstOrCreate(
            ['slug' => 'faqs'],
            [
                'name' => 'Frequently Asked Questions',
                'icon' => 'HelpCircle',
                'status' => 'published',
                'fields' => [
                    ['key' => 'question', 'label' => 'Question', 'type' => 'text', 'required' => true],
                    ['key' => 'answer', 'label' => 'Answer', 'type' => 'textarea', 'required' => true],
                    ['key' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'required' => false],
                ],
                'list_config' => ['columns' => ['question', 'sort_order']],
            ]
        );

        $entries = [
            [
                'slug' => 'how-to-order',
                'status' => 'published',
                'data' => [
                    'question' => 'How do I place an order?',
                    'answer' => 'Browse the marketplace, add items to your cart and check out. You can track everything under Orders.',
                    'sort_order' => 1,
                ],
            ],
            [
                'slug' => 'delivery-time',
                'status' => 'published',
                'data' => [
                    'question' => 'How long does delivery take?',
                    'answer' => 'Standard delivery arrives in 2-5 working days; express options show at checkout.',
                    'sort_order' => 2,
                ],
            ],
            [
                'slug' => 'become-vendor',
                'status' => 'published',
                'data' => [
                    'question' => 'How do I become a vendor?',
                    'answer' => 'Register, complete KYC verification and open your store from the vendor console.',
                    'sort_order' => 3,
                ],
            ],
            [
                'slug' => 'draft-entry',
                'status' => 'draft',
                'data' => [
                    'question' => 'Unpublished draft (hidden from the public API)',
                    'answer' => 'Drafts never leak through the public read path.',
                    'sort_order' => 99,
                ],
            ],
        ];

        foreach ($entries as $entry) {
            DynamicModuleEntry::firstOrCreate(
                ['module_id' => $faqs->id, 'slug' => $entry['slug']],
                [
                    'status' => $entry['status'],
                    'data' => $entry['data'],
                ]
            );
        }
    }
}
