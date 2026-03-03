const SkeletonCard = ({ className = '' }) => {
    return (
        <div className={`skeleton-card-root rounded-2xl p-5 ${className}`}>
            <div className="mb-4 flex items-center gap-3">
                <div className="skeleton-shimmer h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="skeleton-shimmer h-3 w-2/5 rounded-md" />
                    <div className="skeleton-shimmer h-2.5 w-1/4 rounded-md" />
                </div>
            </div>

            <div className="space-y-2">
                <div className="skeleton-shimmer h-4 w-3/5 rounded-md" />
                <div className="skeleton-shimmer h-3 w-full rounded-md" />
                <div className="skeleton-shimmer h-3 w-11/12 rounded-md" />
                <div className="skeleton-shimmer h-3 w-4/5 rounded-md" />
            </div>
        </div>
    );
};

export default SkeletonCard;
