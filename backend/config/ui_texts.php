<?php

/**
 * Editable system text (no-code UI strings).
 *
 * Each entry is a key the super admin can reword from the admin console
 * (Settings -> UI Text) without touching code. `value` is the built-in
 * default; `label` is what the editor shows. Keys are wired into the
 * frontend through the shared `uiTexts` Inertia prop and fall back to
 * these defaults when unset.
 */
return [
    'ui.login_title' => [
        'label' => 'Login page title',
        'value' => 'everythingneed.com',
    ],
    'ui.login_subtitle' => [
        'label' => 'Login page subtitle',
        'value' => 'Your one-stop platform for all human needs',
    ],
    'ui.console_brand_admin' => [
        'label' => 'Admin console brand',
        'value' => 'EverythingNeed Admin',
    ],
    'ui.dashboard_title' => [
        'label' => 'Admin dashboard heading',
        'value' => 'Administration Dashboard',
    ],
    'ui.site_name' => [
        'label' => 'Footer site name',
        'value' => 'everythingneed.com',
    ],
    // Home promo cards (spec S8 sections 5, 7, 10).
    'ui.home_bonus_title' => [
        'label' => 'Home: new user card title',
        'value' => 'New here?',
    ],
    'ui.home_bonus_text' => [
        'label' => 'Home: new user card text',
        'value' => 'Create your free account to shop, learn, book and request services in one place.',
    ],
    'ui.home_bonus_cta' => [
        'label' => 'Home: new user card button',
        'value' => 'Create free account',
    ],
    'ui.home_learn_title' => [
        'label' => 'Home: learning promo title',
        'value' => 'Grow your skills',
    ],
    'ui.home_learn_text' => [
        'label' => 'Home: learning promo text',
        'value' => 'Courses, instructors and certificates across every field - start learning today.',
    ],
    'ui.home_learn_cta' => [
        'label' => 'Home: learning promo button',
        'value' => 'Explore courses',
    ],
    'ui.home_need_title' => [
        'label' => 'Home: submit-need card title',
        'value' => 'Need something?',
    ],
    'ui.home_need_text' => [
        'label' => 'Home: submit-need card text',
        'value' => 'Post a request and receive offers from providers across every category.',
    ],
    'ui.home_need_cta' => [
        'label' => 'Home: submit-need card button',
        'value' => 'Submit your need',
    ],
];
