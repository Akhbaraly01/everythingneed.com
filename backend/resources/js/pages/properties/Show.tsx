import AppLayout from '@/layouts/AppLayout';
import {Head, Link, router, usePage} from '@inertiajs/react';
import type { Property } from '@/types';
import { formatPrice } from '@/lib/currency';
import {MapPin, Bed, Bath, Maximize, Building2, Heart} from 'lucide-react';
import Image from '@/components/shared/Image';
import { useWishlist } from '@/hooks/useWishlist';
import { errorMessage } from '@/lib/api';
import { toast } from 'sonner';

interface PropertyShowProps {
    property: Property;
}

export default function PropertyShow({ property }: PropertyShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const { has: isSaved, toggle: toggleSaved } = useWishlist('property');
    const saved = isSaved(property.id);

    const handleSave = async () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        try {
            const nowSaved = await toggleSaved(property.id);
            toast.success(nowSaved ? 'Property saved' : 'Removed from saved homes');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save property'));
        }
    };

    return (
        <AppLayout>
            <Head title={property.title} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-2/3">
                            {property.images && property.images.length > 0 ? (
                                <Image src={property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    <Building2 className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">{property.property_type}</span>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{property.type}</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{property.title}</h1>
                            <div className="mt-2 flex items-center gap-2 text-gray-500">
                                <MapPin className="h-4 w-4" />
                                {property.address}, {property.city}{property.state ? `, ${property.state}` : ''}, {property.country}
                            </div>
                            <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(property.price)}</p>

                            <div className="mt-4 flex items-center gap-3">
                                <Link
                                    href={`/properties/${property.id}/inquiry`}
                                    className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    Enquire About This Property
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    aria-pressed={saved}
                                    aria-label={saved ? 'Remove from saved homes' : 'Save this home'}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                                        saved
                                            ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                                    {saved ? 'Saved' : 'Save'}
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-4">
                                {property.bedrooms != null && (
                                    <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700">
                                        <Bed className="mx-auto h-5 w-5 text-gray-400" />
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{property.bedrooms} Beds</p>
                                    </div>
                                )}
                                {property.bathrooms != null && (
                                    <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700">
                                        <Bath className="mx-auto h-5 w-5 text-gray-400" />
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{property.bathrooms} Baths</p>
                                    </div>
                                )}
                                {property.area_sqft != null && (
                                    <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700">
                                        <Maximize className="mx-auto h-5 w-5 text-gray-400" />
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{property.area_sqft} sqft</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {property.description && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Description</h2>
                        <p className="mt-4 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{property.description}</p>
                    </div>
                )}

                {/* Details */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Details</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium text-gray-900 dark:text-white">{property.property_type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Listing</p>
                            <p className="font-medium text-gray-900 dark:text-white">{property.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-medium text-gray-900 dark:text-white">{property.country}</p>
                        </div>
                    </div>
                </div>

                {/* Gallery */}
                {property.images && property.images.length > 1 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gallery</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {property.images.slice(1).map((img, i) => (
                                <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                    <Image src={img} alt={`${property.title} ${i + 2}`} className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
