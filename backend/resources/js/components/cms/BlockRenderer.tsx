import { Link } from '@inertiajs/react';
import { formatPrice } from '@/lib/currency';
import { ImageIcon } from 'lucide-react';
import Image from '@/components/shared/Image';

/**
 * No-code CMS block renderer (spec S42/S104).
 *
 * Renders ONLY the 24 registered block types as structured React — content
 * is data, never markup, so output is encoded by React by construction
 * (no dangerouslySetInnerHTML anywhere in this file).
 */

export interface CmsItem {
    id: string;
    title: string;
    subtitle?: string | null;
    image?: string | null;
    url: string;
    badge?: string | null;
    price?: number | null;
}

export interface CmsBlock {
    id?: string;
    type: string;
    data: DataBag;
    is_visible?: boolean;
    items?: CmsItem[];
}

type DataBag = Record<string, unknown>;

interface RendererProps {
    block: CmsBlock;
}

const asStr = (d: DataBag, key: string): string => (typeof d[key] === 'string' ? (d[key] as string) : '');
const asNum = (d: DataBag, key: string, fallback = 0): number => (typeof d[key] === 'number' ? (d[key] as number) : fallback);
const asBool = (d: DataBag, key: string): boolean => d[key] === true || d[key] === 1 || d[key] === 'true';
const rowsOf = <T,>(d: DataBag, key: string): T[] => (Array.isArray(d[key]) ? (d[key] as T[]) : []);

interface GalleryImage { url?: string; alt?: string; caption?: string }
interface CardItem { image?: string; eyebrow?: string; title?: string; body?: string; link?: string }
interface StatItem { value?: string; label?: string }
interface TestimonialItem { quote?: string; name?: string; role?: string; avatar?: string; rating?: number }
interface FaqItem { question?: string; answer?: string }
interface FeatureItem { url?: string; image?: string; badge?: string; title?: string; excerpt?: string }

const SPACERS: Record<string, string> = { sm: 'h-6', md: 'h-12', lg: 'h-20', xl: 'h-28' };

function Heading({ text }: { text?: string | null }) {
    if (!text) return null;
    return <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{text}</h2>;
}

/** Internal paths use Inertia Link; external URLs stay plain anchors. */
function SmartLink({ url, className, children, newTab }: { url: string; className?: string; children: React.ReactNode; newTab?: boolean }) {
    if (url.startsWith('/') || url.startsWith('#')) {
        return <Link href={url} className={className}>{children}</Link>;
    }
    return (
        <a href={url} className={className} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
            {children}
        </a>
    );
}

/** Renders a static container when there is no destination URL. */
function MaybeLink({ url, className, children, newTab }: { url?: string | null; className?: string; children: React.ReactNode; newTab?: boolean }) {
    if (!url) return <div className={className}>{children}</div>;
    return <SmartLink url={url} className={className} newTab={newTab}>{children}</SmartLink>;
}

function embedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
            const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (parsed.hostname.includes('vimeo.com')) {
            const id = parsed.pathname.split('/').filter(Boolean).pop();
            return id ? `https://player.vimeo.com/video/${id}` : null;
        }
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
    } catch {
        return null;
    }
    return null;
}

function DynamicGrid({ block }: RendererProps) {
    const items = block.items ?? [];
    const heading = asStr(block.data ?? {}, 'heading');
    if (items.length === 0) return null;

    const tileOnly = ['need_categories', 'healthcare_services', 'learning_categories'].includes(block.type);

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <Heading text={heading} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                    <SmartLink
                        key={item.id}
                        url={item.url}
                        className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700"
                    >
                        {!tileOnly && (
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {item.image ? (
                                    <Image src={item.image} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                        )}
                        <div className="flex flex-1 flex-col gap-1 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 line-clamp-2 dark:text-white">{item.title}</p>
                                {item.badge && (
                                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            {item.subtitle && <p className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">{item.subtitle}</p>}
                            {typeof item.price === 'number' && (
                                <p className="mt-auto text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(item.price)}</p>
                            )}
                        </div>
                    </SmartLink>
                ))}
            </div>
        </section>
    );
}

export default function BlockRenderer({ block }: RendererProps) {
    if (block.is_visible === false) return null;
    const d: DataBag = block.data ?? {};

    switch (block.type) {
        case 'hero': {
            const alignValue = asStr(d, 'align');
            const align = alignValue === 'left' ? 'text-left' : alignValue === 'right' ? 'text-right' : 'text-center';
            const items = alignValue === 'left' ? 'items-start' : alignValue === 'right' ? 'items-end' : 'items-center';
            const image = asStr(d, 'image');
            const title = asStr(d, 'title');
            const subtitle = asStr(d, 'subtitle');
            const ctaLabel = asStr(d, 'cta_label');
            const ctaUrl = asStr(d, 'cta_url');
            return (
                <section
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-16 text-white sm:py-24 ${align}`}
                    style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                    <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
                    <div className={`relative flex flex-col gap-4 ${items} ${align}`}>
                        <h1 className="max-w-3xl text-3xl font-extrabold sm:text-5xl">{title}</h1>
                        {subtitle && <p className="max-w-2xl text-base text-indigo-100 sm:text-lg">{subtitle}</p>}
                        {ctaLabel && ctaUrl && (
                            <SmartLink
                                url={ctaUrl}
                                className="mt-2 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
                            >
                                {ctaLabel}
                            </SmartLink>
                        )}
                    </div>
                </section>
            );
        }

        case 'rich_text': {
            const paragraphs = asStr(d, 'body').split(/\n{2,}/).filter((p) => p.trim() !== '');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{asStr(d, 'heading')}</h2>
                    <div className="space-y-3 text-gray-700 leading-relaxed dark:text-gray-300">
                        {paragraphs.map((p, i) => (
                            <p key={i} className="whitespace-pre-line">{p}</p>
                        ))}
                    </div>
                </section>
            );
        }

        case 'image':
            return (
                <figure className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                    <MaybeLink url={asStr(d, 'link') || null} className="block">
                        <Image src={asStr(d, 'url')} alt={asStr(d, 'alt')} className="w-full object-cover" loading="lazy" />
                    </MaybeLink>
                    {asStr(d, 'caption') && <figcaption className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{asStr(d, 'caption')}</figcaption>}
                </figure>
            );

        case 'cta': {
            const styles: Record<string, string> = {
                primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
                secondary: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900',
                outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950',
            };
            const style = asStr(d, 'style') || 'primary';
            const buttonUrl = asStr(d, 'button_url');
            return (
                <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{asStr(d, 'heading')}</h2>
                    {asStr(d, 'body') && <p className="mx-auto mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{asStr(d, 'body')}</p>}
                    {buttonUrl && (
                        <SmartLink url={buttonUrl} className={`mt-5 inline-flex rounded-full px-6 py-3 text-sm font-semibold ${styles[style] ?? styles.primary}`}>
                            {asStr(d, 'button_label')}
                        </SmartLink>
                    )}
                </section>
            );
        }

        case 'banner':
            return (
                <MaybeLink url={asStr(d, 'link') || null} newTab={asBool(d, 'open_new_tab')} className="block overflow-hidden rounded-2xl shadow-sm">
                    <Image src={asStr(d, 'image')} alt={asStr(d, 'title') || 'Banner'} className="w-full object-cover" loading="lazy" />
                </MaybeLink>
            );

        case 'video': {
            const src = embedUrl(asStr(d, 'url'));
            if (!src) {
                return (
                    <section className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-sm dark:bg-gray-800">
                        This video source is not supported.
                    </section>
                );
            }
            const aspect = asStr(d, 'aspect');
            const ratio = aspect === '4:3' ? 'aspect-[4/3]' : aspect === '1:1' ? 'aspect-square' : 'aspect-video';
            const isEmbed = src.includes('/embed/') || src.includes('player.vimeo.com');
            const title = asStr(d, 'title');
            return (
                <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                    {title && <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>}
                    <div className={`overflow-hidden rounded-xl bg-black ${ratio}`}>
                        {isEmbed ? (
                            <iframe src={src} title={title || 'Video'} className="h-full w-full" allowFullScreen loading="lazy" />
                        ) : (
                            <video src={src} controls className="h-full w-full" />
                        )}
                    </div>
                    {asStr(d, 'description') && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{asStr(d, 'description')}</p>}
                </section>
            );
        }

        case 'gallery': {
            const cols = asNum(d, 'columns', 3);
            const grid = cols >= 4 ? 'sm:grid-cols-4' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
            const images = rowsOf<GalleryImage>(d, 'images');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <div className={`grid grid-cols-2 gap-3 ${grid}`}>
                        {images.map((img, i) => (
                            <figure key={i} className="overflow-hidden rounded-xl">
                                <Image src={img.url} alt={img.alt || img.caption || ''} className="aspect-square w-full object-cover" loading="lazy" />
                                {img.caption && <figcaption className="px-2 py-1 text-xs text-gray-500">{img.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                </section>
            );
        }

        case 'spacer':
            return <div className={SPACERS[asStr(d, 'size')] ?? SPACERS.md} aria-hidden="true" />;

        case 'divider': {
            const dividerStyle = asStr(d, 'style');
            return (
                <hr
                    className="border-gray-200 dark:border-gray-700"
                    style={dividerStyle === 'dashed' ? { borderTop: '2px dashed' } : dividerStyle === 'dotted' ? { borderTop: '3px dotted' } : undefined}
                    aria-hidden="true"
                />
            );
        }

        case 'cards': {
            const items = rowsOf<CardItem>(d, 'items');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <Heading text={asStr(d, 'heading')} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((c, i) => (
                            <MaybeLink key={i} url={c.link} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                                {c.image && <Image src={c.image} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" loading="lazy" />}
                                {c.eyebrow && <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{c.eyebrow}</span>}
                                <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                                {c.body && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{c.body}</p>}
                            </MaybeLink>
                        ))}
                    </div>
                </section>
            );
        }

        case 'stats': {
            const items = rowsOf<StatItem>(d, 'items');
            return (
                <section className="rounded-2xl bg-indigo-600 p-6 text-white">
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
                        {items.map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl font-extrabold">{s.value}</p>
                                <p className="mt-1 text-xs text-indigo-100">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        case 'testimonials': {
            const items = rowsOf<TestimonialItem>(d, 'items');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((t, i) => (
                            <figure key={i} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                {t.rating ? <div className="mb-2 text-yellow-400">{'★'.repeat(Math.min(5, Math.max(1, Number(t.rating) || 5)))}</div> : null}
                                <blockquote className="text-sm text-gray-700 dark:text-gray-300">“{t.quote}”</blockquote>
                                <figcaption className="mt-3 flex items-center gap-2">
                                    {t.avatar && <Image src={t.avatar} alt="" className="h-8 w-8 rounded-full object-cover" loading="lazy" />}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                                        {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            );
        }

        case 'faq': {
            const items = rowsOf<FaqItem>(d, 'items');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <Heading text={asStr(d, 'heading')} />
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((f, i) => (
                            <details key={i} className="group py-3">
                                <summary className="cursor-pointer list-none font-medium text-gray-900 dark:text-white">
                                    {f.question}
                                    <span className="float-right text-gray-400 transition group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{f.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>
            );
        }

        case 'featured_content': {
            const items = rowsOf<FeatureItem>(d, 'items');
            return (
                <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                    <Heading text={asStr(d, 'heading')} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((c, i) => (
                            <SmartLink key={i} url={c.url ?? ''} className="group overflow-hidden rounded-xl border border-gray-200 transition hover:shadow-md dark:border-gray-700">
                                {c.image && <Image src={c.image} alt="" className="aspect-video w-full object-cover" loading="lazy" />}
                                <div className="p-3">
                                    {c.badge && <span className="mb-1 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{c.badge}</span>}
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                                    {c.excerpt && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{c.excerpt}</p>}
                                </div>
                            </SmartLink>
                        ))}
                    </div>
                </section>
            );
        }

        case 'product_grid':
        case 'course_grid':
        case 'doctor_grid':
        case 'expert_grid':
        case 'vendor_grid':
        case 'category_grid':
        case 'service_grid':
        case 'need_categories':
        case 'healthcare_services':
        case 'learning_categories':
            return <DynamicGrid block={block} />;

        default:
            // Unregistered types can never reach the renderer (registry is
            // closed server-side); render nothing rather than crash.
            return null;
    }
}
