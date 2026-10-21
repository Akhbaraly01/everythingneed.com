import { useEffect, useState } from 'react';

export interface AnchorItem {
    id: string;
    label: string;
}

interface Props {
    items: AnchorItem[];
}

/**
 * Sticky section navigation (Alibaba product page): the active section is
 * highlighted while scrolling, and clicking a link scrolls to it.
 */
export default function ProductAnchorNav({ items }: Props) {
    const [active, setActive] = useState(items[0]?.id ?? '');

    useEffect(() => {
        const onScroll = (): void => {
            const offset = 140;
            let current = items[0]?.id ?? '';

            for (const item of items) {
                const el = document.getElementById(item.id);

                if (el && el.getBoundingClientRect().top - offset <= 0) {
                    current = item.id;
                }
            }

            setActive(current);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, [items]);

    return (
        <nav
            aria-label="Product sections"
            data-testid="product-anchor-nav"
            className="sticky top-16 z-30 -mx-3 overflow-x-auto border-y border-border bg-background/95 px-3 backdrop-blur"
        >
            <ul className="flex items-center gap-1 py-2">
                {items.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            onClick={(event) => {
                                event.preventDefault();
                                document
                                    .getElementById(item.id)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            aria-current={active === item.id ? 'true' : undefined}
                            className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                                active === item.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
