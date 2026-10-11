/** Shared media-library shapes + URL helpers (W1). */

export interface LibraryItem {
    id: string;
    title: string;
    file_name: string;
    disk: string;
    path: string;
    mime_type: string;
    size: number;
    width?: number | null;
    height?: number | null;
}

export interface LibraryPage {
    data: LibraryItem[];
    current_page: number;
    last_page: number;
    total: number;
}

/** Public URL for a library row (public disk is served under /storage). */
export function libraryUrl(item: Pick<LibraryItem, 'disk' | 'path'>): string {
    if (item.path.startsWith('/') || item.path.startsWith('http')) return item.path;
    if (item.disk === 'public') return `/storage/${item.path}`;
    return item.path;
}

export function isImageItem(item: Pick<LibraryItem, 'mime_type'>): boolean {
    return item.mime_type.startsWith('image/');
}
