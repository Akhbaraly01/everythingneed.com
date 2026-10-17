import { Link } from '@inertiajs/react';
import { ArrowRight, Gift, type LucideIcon } from 'lucide-react';
import { buttonClasses } from '@/components/shared/Button';

interface PromoCardProps {
    /** Stable hook for tests/e2e: `home-section-{key}`. */
    testId: string;
    title: string;
    text: string;
    cta: string;
    href: string;
    icon?: LucideIcon;
}

/**
 * CTA card for the Home promo sections (spec S8 sections 5/7/10).
 * Copy comes from uiTexts (Settings -> UI Text) so wording is editable
 * without source-code changes; links are real routes.
 */
export default function PromoCard({
    testId,
    title,
    text,
    cta,
    href,
    icon: Icon = Gift,
}: PromoCardProps) {
    return (
        <section
            data-testid={testId}
            className="glass-1 glass-edge flex items-center gap-4 rounded-xl p-4"
        >
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:flex">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-foreground md:text-base">{title}</h2>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground md:text-sm">{text}</p>
            </div>
            <Link href={href} className={buttonClasses('primary', 'sm')}>
                {cta}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
        </section>
    );
}
