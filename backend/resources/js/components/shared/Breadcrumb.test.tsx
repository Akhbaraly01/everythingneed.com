import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumb from '@/components/shared/Breadcrumb';

// Inertia's Link needs a full app context; the DOM contract under test is
// plain anchors with the right hrefs.
vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        children,
        className,
    }: {
        href: string;
        children: ReactNode;
        className?: string;
    }) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
}));

describe('Breadcrumb', () => {
    it('renders the home root plus linked and plain crumb segments', () => {
        render(
            <Breadcrumb
                items={[
                    { label: 'Orders', href: '/orders' },
                    { label: 'Order #42', href: '/orders/42' },
                    { label: 'Detail' },
                ]}
            />
        );

        const home = screen.getByRole('link', { name: '' });
        expect(home).toHaveAttribute('href', '/dashboard');

        const orders = screen.getByRole('link', { name: 'Orders' });
        expect(orders).toHaveAttribute('href', '/orders');

        expect(
            screen.getByRole('link', { name: 'Order #42' })
        ).toHaveAttribute('href', '/orders/42');

        // Final crumb without href renders as plain text, not a link.
        expect(screen.getByText('Detail').tagName).toBe('SPAN');
        expect(screen.queryByRole('link', { name: 'Detail' })).toBeNull();
    });

    it('renders an empty trail as just the home link', () => {
        render(<Breadcrumb items={[]} />);
        expect(screen.getByRole('link', { name: '' })).toHaveAttribute(
            'href',
            '/dashboard'
        );
        expect(screen.queryByText('Detail')).toBeNull();
    });
});
