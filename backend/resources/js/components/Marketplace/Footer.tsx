import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/use-language';
import type { SiteNav } from '@/types';
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    Mail,
    Phone,
    MapPin,
    Heart,
    Send,
    Shield,
    CheckCircle,
    Award,
    Clock,
    Home as HomeIcon,
    ArrowUp,
} from 'lucide-react';

const paymentMethods = ['Visa', 'Mastercard', 'PayPal', 'Apple Pay', 'Google Pay', 'Stripe', 'Crypto'];

interface FooterProps {
    socialLinks?: {
        facebook?: string | null;
        twitter?: string | null;
        instagram?: string | null;
        linkedin?: string | null;
        youtube?: string | null;
    };
    appLinks?: {
        ios?: string | null;
        android?: string | null;
    };
}

export default function Footer({ socialLinks = {}, appLinks = {} }: FooterProps) {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();
    const { uiTexts, siteNav } = usePage().props as {
        uiTexts?: { ui?: Record<string, { label?: string; value?: string }> };
        siteNav?: SiteNav;
    };
    const siteName = uiTexts?.ui?.site_name?.value || 'everythingneed.com';
    const [email, setEmail] = useState('');
    const [subState, setSubState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [subMessage, setSubMessage] = useState('');

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const socials = [
        { icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
        { icon: Twitter, href: socialLinks.twitter, label: 'Twitter' },
        { icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
        { icon: Linkedin, href: socialLinks.linkedin, label: 'LinkedIn' },
        { icon: Youtube, href: socialLinks.youtube, label: 'YouTube' },
    ].filter((s): s is { icon: typeof Facebook; href: string; label: string } => Boolean(s.href));

    const subscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setSubState('error');
            setSubMessage(t('footer.newsInvalid'));
            return;
        }
        setSubState('sending');
        setSubMessage('');
        try {
            await api.post('/api/newsletter/subscribe', { email: value });
            setSubState('done');
            setSubMessage(t('footer.newsDone'));
            setEmail('');
        } catch {
            setSubState('error');
            setSubMessage(t('footer.newsFail'));
        }
    };

    const footerNav = siteNav?.footer ?? [];
    // DB-driven columns (spec S46). Empty location => the hard-coded
    // default columns below keep the footer complete on fresh installs.
    const footerColumns = footerNav.length
        ? footerNav.map((group) => ({
              title: group.title,
              links: (group.children?.length ? group.children : [group]).map((child) => ({
                  name: child.title,
                  path: child.url,
              })),
          }))
        : [
              {
                  title: t('footer.categories'),
                  links: [
                      { name: 'Electronics', path: '/products?category=electronics' },
                      { name: 'Fashion', path: '/products?category=fashion' },
                      { name: 'Healthcare', path: '/healthcare' },
                      { name: 'Learning', path: '/learn' },
                  ],
              },
              {
                  title: t('footer.account'),
                  links: [
                      { name: 'Dashboard', path: '/dashboard' },
                      { name: 'My Orders', path: '/orders' },
                      { name: 'Wishlist', path: '/wishlist' },
                      { name: 'Wallet', path: '/wallet' },
                      { name: 'Bills & Utilities', path: '/bills' },
                  ],
              },
              {
                  title: t('footer.support'),
                  links: [
                      { name: 'Contact Us', path: '/tickets/create' },
                      { name: 'Help Center', path: '/p/about-everythingneed' },
                      { name: 'FAQs', path: '/p/faqs' },
                  ],
              },
          ];

    return (
        <footer className="glass-1 border-t border-border/60 text-card-foreground relative">
            <div aria-hidden className="h-1 w-full" style={{ backgroundImage: 'var(--gradient-primary)' }} />
            <div className="container mx-auto px-4 pb-6 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="site-nav-footer">
                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h4 className="font-bold text-foreground mb-3 text-base md:text-lg">{column.title}</h4>
                            <ul className="space-y-2">
                                {column.links.map((link) => (
                                    <li key={`${column.title}-${link.name}-${link.path}`}>
                                        <Link href={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-bold text-foreground mb-3 text-base md:text-lg">{t('footer.contact')}</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <HomeIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span className="text-sm text-muted-foreground">EverythingNeed Global HQ, Tech City, Worldwide</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <a href="tel:+15551234567" className="text-sm text-muted-foreground hover:text-foreground">
                                    +1 (555) 123-4567
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <a href="mailto:support@everythingneed.com" className="text-sm text-muted-foreground hover:text-foreground break-all">
                                    support@everythingneed.com
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <a
                                    href="https://maps.google.com/?q=Tech+City"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-muted-foreground hover:text-foreground underline"
                                >
                                    View on Map
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-sm text-muted-foreground">24/7 Customer Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted rounded-lg p-4 mb-4 mt-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="text-center md:text-left">
                            <h3 className="text-sm font-bold text-foreground mb-1">{t('footer.newsTitle')}</h3>
                            <p className="text-muted-foreground text-xs">{t('footer.newsText')}</p>
                        </div>
                        <form onSubmit={(e) => void subscribe(e)} className="w-full md:w-auto">
                            <div className="flex w-full md:w-auto gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('footer.emailPh')}
                                    aria-label={t('footer.emailPh')}
                                    className="max-w-xs flex-1 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground h-8 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    type="submit"
                                    disabled={subState === 'sending'}
                                    className="btn-3d shrink-0 inline-flex items-center !rounded-md bg-primary text-primary-foreground hover:opacity-90 h-8 !px-3 !text-sm font-medium !min-h-0 disabled:opacity-60"
                                >
                                    <Send className="h-3 w-3 mr-1" />
                                    {subState === 'sending' ? t('common.loading') : t('footer.subscribe')}
                                </button>
                            </div>
                            {subMessage && (
                                <p className={`mt-1 text-xs ${subState === 'done' ? 'text-success' : 'text-destructive'}`}>
                                    {subMessage}
                                </p>
                            )}
                        </form>
                    </div>
                </div>

                {(appLinks.ios || appLinks.android) && (
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
                        <div className="text-center lg:text-left">
                            <h4 className="font-semibold mb-3 text-foreground">Download Our Mobile App</h4>
                            <div className="flex gap-2">
                                {appLinks.ios && (
                                    <a href={appLinks.ios} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border text-foreground hover:bg-muted px-3 py-1.5 text-sm">
                                        App Store
                                    </a>
                                )}
                                {appLinks.android && (
                                    <a href={appLinks.android} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border text-foreground hover:bg-muted px-3 py-1.5 text-sm">
                                        Google Play
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
                    <div aria-hidden className="hidden lg:block lg:w-1/4" />
                    <div className="text-center">
                        <h4 className="font-semibold mb-3 text-foreground">We Accept</h4>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {paymentMethods.map((method) => (
                                <div key={method} className="px-3 py-1.5 bg-muted rounded text-xs font-medium text-muted-foreground">
                                    {method}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-center lg:text-right">
                        <h4 className="font-semibold mb-3 text-foreground">Security &amp; Trust</h4>
                        <div className="flex gap-2 flex-wrap justify-center lg:justify-end">
                            <span className="inline-flex items-center gap-1 rounded-md border border-border text-muted-foreground px-2 py-1 text-xs">
                                <Shield className="h-3 w-3" />
                                SSL Secured
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-border text-muted-foreground px-2 py-1 text-xs">
                                <CheckCircle className="h-3 w-3" />
                                Verified Business
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-border text-muted-foreground px-2 py-1 text-xs">
                                <Award className="h-3 w-3" />
                                ISO Certified
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
                    {socials.length > 0 && (
                        <div className="flex items-center gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={social.label}
                                    className="p-2 rounded-full bg-muted transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap justify-center">
                        © {currentYear} {siteName}. Made with
                        <Heart className="h-4 w-4 text-destructive fill-destructive" />
                        for humanity. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                    <Link href="/p/privacy-policy" className="hover:text-foreground transition-colors">
                        Privacy Policy
                        </Link>
                    <Link href="/p/terms-of-service" className="hover:text-foreground transition-colors">
                        Terms of Service
                        </Link>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll to top"
                className="glass-3 glass-edge tap-safe fixed bottom-[calc(var(--dock-clearance)+64px)] right-4 z-cluster hidden h-11 w-11 items-center justify-center rounded-full text-foreground shadow-lg transition-transform duration-fast ease-out-spring hover:scale-105 active:scale-95 md:flex"
            >
                <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </button>
        </footer>
    );
}
