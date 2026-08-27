export default function SchemeCardSkeleton() {
    return (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5 sm:p-6 animate-pulse">
            <div className="flex items-start gap-4">
                {/* Score ring skeleton */}
                <div className="shrink-0 w-14 h-14 rounded-full bg-bg-secondary" />

                <div className="flex-1 space-y-3">
                    {/* Title */}
                    <div className="h-5 bg-bg-secondary rounded w-3/4" />
                    {/* Ministry */}
                    <div className="h-3 bg-bg-secondary rounded w-1/2" />
                    {/* Badges */}
                    <div className="flex gap-2">
                        <div className="h-5 bg-bg-secondary rounded-full w-20" />
                        <div className="h-5 bg-bg-secondary rounded-full w-16" />
                    </div>
                    {/* Explanation */}
                    <div className="space-y-2">
                        <div className="h-3 bg-bg-secondary rounded w-full" />
                        <div className="h-3 bg-bg-secondary rounded w-2/3" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light">
                <div className="h-4 bg-bg-secondary rounded w-20" />
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-bg-secondary rounded-lg" />
                    <div className="w-28 h-8 bg-bg-secondary rounded-lg" />
                </div>
            </div>
        </div>
    );
}
