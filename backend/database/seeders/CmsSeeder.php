<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Admin\Entities\CmsBlock;
use Modules\Admin\Entities\CmsPage;
use Modules\Admin\Entities\MediaItem;
use Modules\Admin\Services\Cms\PageBuilderService;

/**
 * Seed content for a fresh install so the CMS console and the public
 * endpoints (pages/blog/banners/announcements) are not empty on day one.
 * Idempotent: rows are keyed by their natural key and updated in place.
 */
class CmsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach ([
            ['title' => 'About EverythingNeed', 'content' => '<p>EverythingNeed is the everything marketplace: products, services, jobs, stays and more — in one place.</p>', 'status' => 'published'],
            ['title' => 'Terms of Service', 'content' => '<p>Sample terms of service seeded for development. Replace this page with the operator\'s approved legal text before launch (CMS &rarr; Pages).</p>', 'status' => 'published'],
            ['title' => 'Privacy Policy', 'content' => '<p>EverythingNeed collects your account, order and usage data to operate the marketplace. Manage visibility and contact preferences anytime in Account &rarr; Privacy. Contact support to request export or deletion of your data.</p>', 'status' => 'published'],
            ['title' => 'FAQs', 'content' => '<p><strong>How do I track my order?</strong> Open Orders &rarr; Tracking, or Deliveries for rider status.</p><p><strong>How do I pay?</strong> Card, wallet balance or cash-on-delivery where offered - totals are always computed server-side at checkout.</p><p><strong>How do I become a vendor or rider?</strong> Use Become a Vendor, or Deliveries &rarr; Register as rider.</p><p><strong>Need help?</strong> Open a support ticket and our team will respond.</p>', 'status' => 'published'],
        ] as $page) {
            $this->upsert('cms_pages', 'slug', Str::slug($page['title']), [
                'title' => $page['title'],
                'content' => $page['content'],
                'status' => $page['status'],
            ], $now);
        }

        $this->seedBlockBuilderPage($now);

        $this->upsert('cms_blog_posts', 'slug', Str::slug('Welcome to EverythingNeed'), [
            'title' => 'Welcome to EverythingNeed',
            'content' => '<p>Our very first post — announcing the launch of the everything marketplace.</p>',
            'author' => 'EverythingNeed Team',
            'status' => 'published',
            'published_at' => $now,
        ], $now);

        $this->upsert('cms_banners', 'title', 'Welcome Banner', [
            'position' => 'homepage',
            'image_url' => null,
            'link_url' => '/',
            'is_active' => true,
            'sort_order' => 0,
        ], $now);

        // Six-sliders home: five more real campaign banners (homepage slot,
        // distinct deep links). Images stay null until an admin uploads
        // campaign art in CMS -> Banners; the slider renders gradients.
        foreach ([
            ['title' => 'Shop Electronics', 'link_url' => '/products?category=electronics', 'sort_order' => 1],
            ['title' => 'Fresh Food Delivery', 'link_url' => '/food', 'sort_order' => 2],
            ['title' => 'Learn New Skills', 'link_url' => '/learn', 'sort_order' => 3],
            ['title' => 'Find Trusted Workers', 'link_url' => '/building-services', 'sort_order' => 4],
            ['title' => 'Book Your Stay', 'link_url' => '/hotels', 'sort_order' => 5],
        ] as $banner) {
            $this->upsert('cms_banners', 'title', $banner['title'], [
                'position' => 'homepage',
                'image_url' => null,
                'link_url' => $banner['link_url'],
                'is_active' => true,
                'sort_order' => $banner['sort_order'],
            ], $now);
        }

        $this->upsert('cms_announcements', 'title', 'Platform live', [
            'content' => '<p>EverythingNeed is now live. Welcome aboard!</p>',
            'priority' => 'high',
            'is_active' => true,
            'starts_at' => $now,
            'ends_at' => $now->copy()->addYear(),
        ], $now);
    }

    /**
     * Spec S41 example page: a published CMS page built entirely from the
     * no-code block set (hero + rich text + image + cards + CTA + FAQ) with
     * revision 1, so the builder and the public /p/{slug} route have real
     * content on a fresh install.
     */
    private function seedBlockBuilderPage(\DateTimeInterface $now): void
    {
        // W1: local demo image. The old via.placeholder.com URL is dead, so
        // the harvested hero banner is provisioned into public storage and
        // referenced locally - a fresh install never touches an external host.
        $image = $this->provisionScholarshipHero();

        $this->upsert('cms_pages', 'slug', 'student-scholarship', [
            'title' => 'Student Scholarship',
            'content' => '',
            'description' => 'Scholarship programme for students: what the grant covers, who can apply and how to submit your application.',
            'seo_title' => 'Student Scholarship | EverythingNeed',
            'seo_description' => 'Apply for the EverythingNeed student scholarship: tuition support, mentorship and internship access — eligibility, benefits and application steps.',
            'seo_image' => $image,
            'canonical_url' => null,
            'visibility' => 'public',
            'template' => 'default',
            'menu_placement' => 'footer',
            'status' => 'published',
            'published_at' => $now,
        ], $now);

        $page = CmsPage::where('slug', 'student-scholarship')->first();
        if ($page === null) {
            return;
        }

        // Idempotent: never re-apply blocks over an editor's saved work.
        if (CmsBlock::where('page_id', $page->id)->exists()) {
            $this->repairDeadBlockImages($page->id, $image);

            return;
        }

        $blocks = [
            [
                'type' => 'hero',
                'data' => [
                    'title' => 'Student Scholarship',
                    'subtitle' => 'Financial support for students building their future through learning on EverythingNeed.',
                    'image' => $image,
                    'cta_label' => 'See how to apply',
                    'cta_url' => '#how-to-apply',
                    'align' => 'center',
                    'theme' => 'light',
                ],
                'is_visible' => true,
            ],
            [
                'type' => 'rich_text',
                'data' => [
                    'heading' => 'About the programme',
                    'body' => "The EverythingNeed Student Scholarship helps students pay for courses, certifications and study materials. Awards are reviewed every quarter and granted based on need, academic progress and community contribution.\n\nEach recipient gets a learning grant, a mentor from our expert network and a fast track to internship openings posted by verified vendors on the marketplace.",
                ],
                'is_visible' => true,
            ],
            [
                'type' => 'image',
                'data' => [
                    'url' => $image,
                    'alt' => 'Students collaborating on coursework',
                    'caption' => 'Scholarship recipients receive learning grants and mentorship.',
                    'link' => '/learn',
                ],
                'is_visible' => true,
            ],
            [
                'type' => 'cards',
                'data' => [
                    'heading' => 'What recipients get',
                    'items' => [
                        ['title' => 'Tuition support', 'body' => 'A learning grant toward course fees and certification exams.', 'eyebrow' => 'Grant', 'link' => '/learn', 'image' => ''],
                        ['title' => 'Mentorship', 'body' => 'One-to-one guidance from an expert in your field of study.', 'eyebrow' => 'Mentor', 'link' => '/experts', 'image' => ''],
                        ['title' => 'Internship access', 'body' => 'Priority introductions to internship openings from verified vendors.', 'eyebrow' => 'Career', 'link' => '/jobs', 'image' => ''],
                    ],
                ],
                'is_visible' => true,
            ],
            [
                'type' => 'cta',
                'data' => [
                    'heading' => 'Ready to apply?',
                    'body' => 'Post your education need on the marketplace — our team reviews every application within 10 working days.',
                    'button_label' => 'Post your need',
                    'button_url' => '/needs',
                    'style' => 'primary',
                ],
                'is_visible' => true,
            ],
            [
                'type' => 'faq',
                'data' => [
                    'heading' => 'Frequently asked questions',
                    'items' => [
                        ['question' => 'Who can apply?', 'answer' => 'Any student with an active EverythingNeed account, enrolled in an accredited course, bootcamp or degree programme.'],
                        ['question' => 'What does the scholarship cover?', 'answer' => 'Course fees, certification exams and required study materials. It does not cover hardware or travel costs.'],
                        ['question' => 'How long does a review take?', 'answer' => 'Applications are reviewed within 10 working days. You will be notified by email and in your account inbox.'],
                    ],
                ],
                'is_visible' => true,
            ],
        ];

        app(PageBuilderService::class)->saveBlocks($page, $blocks, 'Seed: initial blocks', null);
    }

    /**
     * Copy the harvested hero banner into public storage (once) and record
     * it in the media library. Returns the local public URL.
     */
    private function provisionScholarshipHero(): string
    {
        $relative = 'seed/cms/scholarship-hero.jpg';

        if (! Storage::disk('public')->exists($relative)) {
            $source = database_path('seeders/assets/hero-banner.jpg');
            Storage::disk('public')->put($relative, file_get_contents($source));
        }

        MediaItem::firstOrCreate(
            ['path' => $relative],
            [
                'title' => 'Scholarship hero',
                'file_name' => 'scholarship-hero.jpg',
                'disk' => 'public',
                'mime_type' => 'image/jpeg',
                'size' => (int) Storage::disk('public')->size($relative),
                'owner_type' => null,
                'owner_id' => null,
                'meta' => ['folder' => 'cms', 'scope' => 'seed'],
            ]
        );

        return '/storage/'.$relative;
    }

    /**
     * W1 repair: earlier seeds wrote the dead via.placeholder.com URL into
     * block data. Swap the known dead URL for the local hero without
     * touching any editor-saved content around it.
     */
    private function repairDeadBlockImages(string $pageId, string $image): void
    {
        $old = 'https://via.placeholder.com/640x480.png/0000ee?text=scholarship';

        foreach (CmsBlock::where('page_id', $pageId)->get() as $block) {
            // UNESCAPED_SLASHES: default json_encode turns / into \/ and
            // the dead URL would never match the plain-slash literal.
            $json = json_encode($block->data, JSON_UNESCAPED_SLASHES);
            if (! is_string($json) || ! str_contains($json, $old)) {
                continue;
            }
            $block->data = json_decode(str_replace($old, $image, $json), true);
            $block->save();
        }
    }

    /**
     * Insert-or-update a CMS row keyed by a natural key (query-builder
     * updateOrCreate does not exist — only Eloquent has it).
     */
    private function upsert(string $table, string $keyColumn, string $keyValue, array $values, \DateTimeInterface $now): void
    {
        $exists = DB::table($table)->where($keyColumn, $keyValue)->exists();

        if ($exists) {
            // Keep created_at intact — only refresh the seeded content.
            DB::table($table)->where($keyColumn, $keyValue)->update(
                array_merge($values, ['updated_at' => $now]),
            );

            return;
        }

        DB::table($table)->insert(array_merge($values, [
            $keyColumn => $keyValue,
            'id' => (string) Str::uuid(),
            'created_at' => $now,
            'updated_at' => $now,
        ]));
    }
}
