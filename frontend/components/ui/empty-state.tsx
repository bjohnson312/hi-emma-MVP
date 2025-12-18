import { Button } from "./button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
  actionLabel?: string;
}

export function EmptyState({
  title = "No data available",
  description = "Try refreshing the page",
  onRetry,
  icon,
  actionLabel = "Try Again"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
