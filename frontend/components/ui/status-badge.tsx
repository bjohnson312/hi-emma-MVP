import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "beta" | "coming-soon" | "experimental";
  className?: string;
}

export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    beta: "bg-blue-100 text-blue-800 border-blue-200",
    "coming-soon": "bg-purple-100 text-purple-800 border-purple-200",
    experimental: "bg-amber-100 text-amber-800 border-amber-200"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
