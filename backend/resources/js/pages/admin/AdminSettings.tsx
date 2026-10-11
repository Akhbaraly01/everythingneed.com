import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import { Plus, Save, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FeatureFlag {
    key: string;
    name: string;
    description?: string | null;
    enabled: boolean;
}

interface SettingRow {
    key: string;
    value: string;
    /** Added in this session and not persisted yet — only then is the key editable. */
    isNew?: boolean;
}

/** Editable system text (Settings -> UI Text): key, human label, current value. */
interface UiTextRow {
    key: string;
    label: string;
    value: string;
}

const toBool = (v: unknown): boolean => v === true || v === 'true' || v === '1' || v === 1;

export default function AdminSettings() {
    const [rows, setRows] = useState<SettingRow[]>([]);
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [texts, setTexts] = useState<UiTextRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingTexts, setSavingTexts] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<SettingRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadSettings = () =>
        api
            .get<{ data: Record<string, unknown> }>('/api/admin/settings')
            .then((s) => {
                const map = s.data ?? {};
                setRows(Object.entries(map).map(([key, value]) => ({ key, value: String(value ?? '') })));
            })
            .catch((e) => toast.error(errorMessage(e, 'Failed to load settings')));

    const loadTexts = () =>
        api
            .get<{ data: Record<string, { label?: string; value?: string }> }>('/api/admin/ui-texts')
            .then((t) => {
                setTexts(
                    Object.entries(t.data ?? {}).map(([key, meta]) => ({
                        key,
                        label: meta?.label ?? key,
                        value: String(meta?.value ?? ''),
                    })),
                );
            })
            .catch(() => setTexts([]));

    useEffect(() => {
        Promise.all([
            loadSettings(),
            loadTexts(),
            api.get<{ data: FeatureFlag[] }>('/api/admin/feature-flags'),
        ])
            .then(([, , f]) => {
                setFlags((Array.isArray(f.data) ? f.data : []).map((fl) => ({ ...fl, enabled: toBool(fl.enabled) })));
            })
            .catch((e) => toast.error(errorMessage(e, 'Failed to load settings')))
            .finally(() => setLoading(false));
    }, []);

    const updateText = (i: number, value: string) =>
        setTexts(texts.map((t, idx) => (idx === i ? { ...t, value } : t)));

    const saveTexts = async () => {
        setSavingTexts(true);
        try {
            await api.put('/api/admin/settings', {
                settings: texts.map((t) => ({ key: t.key, value: t.value })),
            });
            toast.success('System text saved — pages pick it up immediately.');
            await loadTexts();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to save system text'));
        } finally {
            setSavingTexts(false);
        }
    };

    const updateRow = (i: number, patch: Partial<SettingRow>) =>
        setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    const requestRemove = (row: SettingRow) => {
        if (row.isNew) {
            // Never persisted — just drop it locally.
            setRows(rows.filter((r) => !(r.isNew && r.key === row.key)));
            return;
        }
        setDeleteTarget(row);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.del(`/api/admin/settings/${encodeURIComponent(deleteTarget.key)}`);
            toast.success(`'${deleteTarget.key}' deleted.`);
            setDeleteTarget(null);
            await loadSettings();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to delete setting'));
        } finally {
            setDeleting(false);
        }
    };

    const addRow = () => {
        const key = newKey.trim();
        if (!key) return;
        if (rows.some((r) => r.key === key)) {
            toast.error('That setting key already exists.');
            return;
        }
        setRows([...rows, { key, value: newValue, isNew: true }]);
        setNewKey('');
        setNewValue('');
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.put('/api/admin/settings', {
                settings: rows.map((r) => ({ key: r.key, value: r.value })),
            });
            toast.success('Settings saved.');
            // Reload so saved rows become immutable (keys are identifiers).
            await loadSettings();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to save settings'));
        } finally {
            setSaving(false);
        }
    };

    const toggleFlag = async (flag: FeatureFlag) => {
        const next = !flag.enabled;
        setFlags(flags.map((f) => (f.key === flag.key ? { ...f, enabled: next } : f)));
        try {
            await api.put(`/api/admin/feature-flags/${encodeURIComponent(flag.key)}`, { enabled: next });
            toast.success(`${flag.name} ${next ? 'enabled' : 'disabled'}.`);
        } catch (e) {
            setFlags(flags.map((f) => (f.key === flag.key ? { ...f, enabled: !next } : f)));
            toast.error(errorMessage(e, 'Failed to update flag'));
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Admin Settings">
                <div className="max-w-2xl space-y-4" aria-busy="true" aria-live="polite">
                    <div className="h-8 w-52 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Admin Settings">
            <Head title="Admin Settings" />
            <div className="max-w-2xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Settings className="h-6 w-6" aria-hidden="true" /> Admin Settings
                </h1>

                <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800" aria-labelledby="settings-heading">
                    <div className="flex items-center justify-between">
                        <h2 id="settings-heading" className="font-semibold text-gray-900 dark:text-white">
                            System Settings
                        </h2>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>

                    {rows.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No settings stored yet — add one below.</p>
                    ) : (
                        <ul className="mt-4 space-y-2">
                            {rows.map((r, i) => (
                                <li key={r.key} className="flex items-center gap-2">
                                    <label className="sr-only" htmlFor={`setting-key-${i}`}>Setting key</label>
                                    <input
                                        id={`setting-key-${i}`}
                                        value={r.key}
                                        readOnly={!r.isNew}
                                        title={r.isNew ? undefined : 'Keys are immutable — delete and re-add to rename'}
                                        onChange={(e) => updateRow(i, { key: e.target.value })}
                                        className={`w-2/5 rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white ${r.isNew ? '' : 'cursor-not-allowed opacity-70'}`}
                                    />
                                    <label className="sr-only" htmlFor={`setting-value-${i}`}>Setting value</label>
                                    <input
                                        id={`setting-value-${i}`}
                                        value={r.value}
                                        onChange={(e) => updateRow(i, { value: e.target.value })}
                                        className="flex-1 rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    />
                                    <button
                                        onClick={() => requestRemove(r)}
                                        aria-label={`Remove setting ${r.key}`}
                                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <label className="sr-only" htmlFor="new-setting-key">New setting key</label>
                        <input
                            id="new-setting-key"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="key"
                            className="w-1/3 rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600"
                        />
                        <label className="sr-only" htmlFor="new-setting-value">New setting value</label>
                        <input
                            id="new-setting-value"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="value"
                            className="flex-1 rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600"
                        />
                        <button
                            onClick={addRow}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" /> Add
                        </button>
                    </div>
                </section>

                <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800" aria-labelledby="uitexts-heading">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 id="uitexts-heading" className="font-semibold text-gray-900 dark:text-white">
                                UI Text
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Wording shown across the system — edit here, no code changes needed.
                            </p>
                        </div>
                        <button
                            onClick={() => void saveTexts()}
                            disabled={savingTexts}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" aria-hidden="true" /> {savingTexts ? 'Saving…' : 'Save'}
                        </button>
                    </div>

                    {texts.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No editable text defined.</p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {texts.map((t, i) => (
                                <li key={t.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:gap-3">
                                    <div>
                                        <label htmlFor={`uitext-${i}`} className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t.label}
                                        </label>
                                        <p className="text-[11px] text-gray-400">{t.key}</p>
                                    </div>
                                    <input
                                        id={`uitext-${i}`}
                                        value={t.value}
                                        onChange={(e) => updateText(i, e.target.value)}
                                        className="rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800" aria-labelledby="flags-heading">
                    <h2 id="flags-heading" className="font-semibold text-gray-900 dark:text-white">
                        Feature Flags
                    </h2>
                    {flags.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No feature flags defined.</p>
                    ) : (
                        <ul className="mt-2 divide-y dark:divide-gray-700">
                            {flags.map((f) => (
                                <li key={f.key} className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                                        {f.description && (
                                            <p className="text-xs text-gray-500">{f.description}</p>
                                        )}
                                    </div>
                                    <button
                                        role="switch"
                                        aria-checked={f.enabled}
                                        aria-label={`Toggle ${f.name}`}
                                        onClick={() => toggleFlag(f)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                                            f.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                f.enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                title={`Delete '${deleteTarget?.key ?? ''}'?`}
                description="The setting row is removed from system_settings (keys are immutable — re-add with a new key to rename)."
                confirmLabel="Delete"
                danger
                busy={deleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}
