interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 w-full animate-pulse rounded bg-muted/50"
          style={{ 
            width: i === lines - 1 ? '75%' : '100%',
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-lg border border-border p-6"
        >
          <div className="mb-3 h-6 w-1/3 animate-pulse rounded bg-muted/50" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
