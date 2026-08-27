export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500">{message}</p>
        </div>
    );
}

export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
    return (
        <div className="rounded-lg bg-red-50 p-8 text-center dark:bg-red-900/20">
            <p className="font-medium text-red-800 dark:text-red-300">{message}</p>
            {onRetry && <button onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Try again</button>}
        </div>
    );
}
