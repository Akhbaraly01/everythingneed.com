import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Restaurant, MenuItem } from '@/types';
import { MapPin, Star, Leaf, Flame, Plus, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Image from '@/components/shared/Image';
import ContextualReviews from '@/components/shared/ContextualReviews';

interface CartRow {
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    menu_item: { id: string; name: string; price: number };
}

interface StoredFoodCart {
    items: CartRow[];
    restaurant_id: string;
    restaurant_name: string;
    subtotal: number;
}

function readFoodCart(): StoredFoodCart | null {
    try {
        const stored = localStorage.getItem('food_cart');
        return stored ? (JSON.parse(stored) as StoredFoodCart) : null;
    } catch {
        return null;
    }
}

interface RestaurantShowProps {
    restaurant: Restaurant & { menu_items?: MenuItem[] };
}

export default function RestaurantShow({ restaurant }: RestaurantShowProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const cart = readFoodCart();
        if (cart?.restaurant_id === restaurant.id) {
            setCartCount(cart.items.reduce((n, i) => n + i.quantity, 0));
        }
    }, [restaurant.id]);

    const addToCart = (item: MenuItem) => {
        const existing = readFoodCart();
        const items = existing && existing.restaurant_id === restaurant.id ? [...existing.items] : [];
        if (existing && existing.restaurant_id !== restaurant.id && existing.items.length > 0) {
            toast.info('Started a new cart — items from the previous restaurant were removed.');
        }
        const row = items.find((i) => i.menu_item_id === item.id);
        if (row) {
            row.quantity += 1;
        } else {
            items.push({
                id: item.id,
                menu_item_id: item.id,
                quantity: 1,
                unit_price: Number(item.price),
                menu_item: { id: item.id, name: item.name, price: Number(item.price) },
            });
        }
        const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
        try {
            localStorage.setItem('food_cart', JSON.stringify({
                items,
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                subtotal,
            }));
        } catch {
            toast.error('Could not save your cart on this device.');
            return;
        }
        setCartCount(items.reduce((n, i) => n + i.quantity, 0));
        toast.success(`${item.name} added to cart.`);
    };

    const menuCategories = ['All', ...Array.from(new Set(restaurant.menu_items?.map((item) => item.category).filter((c): c is string => Boolean(c)) ?? []))];
    const filteredMenu = selectedCategory === 'All'
        ? restaurant.menu_items ?? []
        : (restaurant.menu_items ?? []).filter((item) => item.category === selectedCategory);

    return (
        <AppLayout>
            <Head title={restaurant.name} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/3">
                            {restaurant.image_url ? (
                                <Image src={restaurant.image_url} alt={restaurant.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{restaurant.name}</h1>
                            <p className="mt-1 text-lg text-indigo-600">{restaurant.cuisine_type}</p>
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{restaurant.address}, {restaurant.city}</span>
                                {restaurant.rating != null && (
                                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{restaurant.rating}</span>
                                )}
                                {restaurant.phone && <span>{restaurant.phone}</span>}
                            </div>
                            {restaurant.description && (
                                <p className="mt-4 text-gray-600 dark:text-gray-400">{restaurant.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Menu</h2>
                        {cartCount > 0 && (
                            <Link
                                href="/food/cart"
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                <ShoppingCart className="h-4 w-4" /> View cart ({cartCount})
                            </Link>
                        )}
                    </div>

                    {/* Category filter */}
                    {menuCategories.length > 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {menuCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                        selectedCategory === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Menu items */}
                    <div className="mt-6 divide-y dark:divide-gray-700">
                        {filteredMenu.length === 0 ? (
                            <p className="py-8 text-center text-gray-500">No menu items available.</p>
                        ) : (
                            filteredMenu.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                                            {item.is_vegetarian && <Leaf className="h-3 w-3 text-green-500" />}
                                            {item.is_vegan && <span className="text-xs text-green-600">Vegan</span>}
                                            {item.spice_level != null && item.spice_level > 0 && (
                                                <span className="flex items-center gap-0.5 text-xs text-orange-500">
                                                    <Flame className="h-3 w-3" />{item.spice_level}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                        )}
                                        {item.category && (
                                            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-4 text-right">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${item.price.toFixed(2)}</p>
                                        {!item.is_available ? (
                                            <p className="text-xs text-red-500">Unavailable</p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                className="mt-1 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                            >
                                                <Plus className="h-4 w-4" /> Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <ContextualReviews reviewableType="restaurant" reviewableId={restaurant.id} title="Restaurant reviews" />
            </div>
        </AppLayout>
    );
}
