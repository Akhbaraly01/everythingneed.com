import { useEffect, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Sheet } from '@/components/shared/Sheet';
import { ROLE_SLUG_PATTERN, slugifyRole } from '@/lib/rbac';
import { Plus } from 'lucide-react';
import { PermissionPicker } from './PermissionPicker';

interface Payload {
    name: string;
    slug: string;
    description: string;
    permissions: string[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    catalog: string[];
    creating: boolean;
    /** Resolves true when the role was created server-side. */
    onCreate: (payload: Payload) => Promise<boolean>;
}

const INPUT_CLASS =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ' +
    'placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Slide-over for creating a custom role with its initial permission set. */
export function CreateRoleSheet({ open, onClose, catalog, creating, onCreate }: Props) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [description, setDescription] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Fresh form every time the sheet opens.
    useEffect(() => {
        if (open) {
            setName('');
            setSlug('');
            setSlugTouched(false);
            setDescription('');
            setSelected(new Set());
        }
    }, [open]);

    const effectiveSlug = slugTouched ? slug.trim() : slugifyRole(name);
    const slugValid = ROLE_SLUG_PATTERN.test(effectiveSlug);
    const nameValid = name.trim().length >= 2;

    const toggle = (permission: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(permission)) next.delete(permission);
            else next.add(permission);
            return next;
        });
    };

    const submit = async () => {
        if (!nameValid || !slugValid || creating) return;
        const ok = await onCreate({
            name: name.trim(),
            slug: effectiveSlug,
            description: description.trim(),
            permissions: Array.from(selected),
        });
        if (ok) onClose();
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            variant="right"
            title="Create role"
            description="Name the role and pick the permissions it should start with."
        >
            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="rbac-role-name"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                        Role name
                    </label>
                    <input
                        id="rbac-role-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. Regional Manager"
                        maxLength={60}
                        className={INPUT_CLASS}
                    />
                </div>

                <div>
                    <label
                        htmlFor="rbac-role-slug"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                        Slug
                    </label>
                    <input
                        id="rbac-role-slug"
                        value={effectiveSlug}
                        onChange={(event) => {
                            setSlugTouched(true);
                            setSlug(event.target.value);
                        }}
                        placeholder="regional_manager"
                        maxLength={40}
                        spellCheck={false}
                        className={INPUT_CLASS}
                    />
                    <p
                        className={`mt-1 text-xs ${
                            effectiveSlug !== '' && !slugValid
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                        }`}
                    >
                        Lowercase letters, numbers and underscores (3-40 chars, starts with a letter).
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="rbac-role-description"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                        Description (optional)
                    </label>
                    <textarea
                        id="rbac-role-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={2}
                        maxLength={255}
                        placeholder="What is this role for?"
                        className={INPUT_CLASS}
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Permissions</span>
                        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                    </div>
                    <PermissionPicker
                        catalog={catalog}
                        selected={selected}
                        onToggle={toggle}
                        disabled={creating}
                    />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={creating}>
                        Cancel
                    </Button>
                    <Button
                        iconLeft={<Plus className="h-4 w-4" />}
                        disabled={!nameValid || !slugValid || creating}
                        loading={creating}
                        onClick={() => void submit()}
                    >
                        Create role
                    </Button>
                </div>
            </div>
        </Sheet>
    );
}

export default CreateRoleSheet;
