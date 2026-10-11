import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/shared/Button';
import Image from '@/components/shared/Image';

describe('Button', () => {
    it('defaults to type="button" so it never submits a form accidentally', () => {
        render(<Button>Save</Button>);
        expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
    });

    it('calls onClick and does not fire while loading', async () => {
        const onClick = vi.fn();
        const { rerender } = render(<Button onClick={onClick}>Go</Button>);
        await userEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(
            <Button onClick={onClick} loading>
                Go
            </Button>,
        );
        const busy = screen.getByRole('button', { name: 'Go' });
        expect(busy).toHaveAttribute('aria-busy', 'true');
        expect(busy).toBeDisabled();
        fireEvent.click(busy);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders icon-only buttons with an accessible name from aria-label', () => {
        render(
            <Button iconOnly aria-label="Open cart">
                <span data-testid="glyph" />
            </Button>,
        );
        expect(screen.getByRole('button', { name: 'Open cart' })).toBeInTheDocument();
    });
});

describe('Image', () => {
    it('falls back to the placeholder when src is empty', () => {
        render(<Image src={null} alt="Product" />);
        expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('src', '/placeholder.svg');
    });

    it('swaps to fallbackNode when the source fails and recovers on a new src', () => {
        const { rerender } = render(
            <Image src="/storage/missing.png" alt="Drip kit" fallbackNode={<span>Fallback tile</span>} />,
        );
        fireEvent.error(screen.getByAltText('Drip kit'));
        expect(screen.getByText('Fallback tile')).toBeInTheDocument();

        rerender(<Image src="/storage/other.png" alt="Drip kit" fallbackNode={<span>Fallback tile</span>} />);
        expect(screen.queryByText('Fallback tile')).not.toBeInTheDocument();
        expect(screen.getByAltText('Drip kit')).toHaveAttribute('src', '/storage/other.png');
    });
});
