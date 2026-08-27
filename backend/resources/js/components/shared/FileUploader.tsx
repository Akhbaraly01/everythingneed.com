import { Upload, X, File } from 'lucide-react';
import { useState } from 'react';

interface Props {
    accept?: string;
    maxSizeMB?: number;
    onFile: (file: File) => void;
    value?: File | null;
    onClear?: () => void;
}

export default function FileUploader({ accept = 'image/*,.pdf', maxSizeMB = 5, onFile, value, onClear }: Props) {
    const [error, setError] = useState('');
    const handle = (f: File | undefined) => {
        if (!f) return;
        if (f.size > maxSizeMB * 1024 * 1024) { setError(`File must be under ${maxSizeMB}MB`); return; }
        setError(''); onFile(f);
    };
    return (
        <div className="space-y-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to upload or drag & drop</span>
                <span className="text-xs text-gray-400">{accept} · max {maxSizeMB}MB</span>
                <input type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
            </label>
            {value && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700">
                    <span className="flex items-center gap-2 text-sm dark:text-white"><File className="h-4 w-4" />{value.name}</span>
                    {onClear && <button onClick={onClear} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>}
                </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
