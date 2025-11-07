import { useState, ReactNode } from "react";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  variant?: "default" | "callout";
}

export default function Tooltip({ children, content, side = "top", variant = "default" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const isCallout = variant === "callout";

  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 animate-in fade-in-0 zoom-in-95 duration-200 ${
            isCallout 
              ? `px-3 py-2 w-full text-xs font-normal text-white bg-white/15 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 ${
                  side === "top" ? "bottom-full left-0 mb-2" :
                  side === "bottom" ? "top-full left-0 mt-2" :
                  side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-3 max-w-xs" :
                  "left-full top-1/2 -translate-y-1/2 ml-3 max-w-xs"
                }`
              : `px-3 py-2 text-xs font-medium text-white bg-gradient-to-br from-[#4e8f71] to-[#364d89] rounded-xl shadow-2xl whitespace-nowrap ${
                  side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" :
                  side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" :
                  side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" :
                  "left-full top-1/2 -translate-y-1/2 ml-2"
                }`
          }`}
        >
          {content}
          {!isCallout && (
            <div
              className={`absolute w-2 h-2 bg-[#4e8f71] rotate-45 ${
                side === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" :
                side === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" :
                side === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" :
                "left-[-4px] top-1/2 -translate-y-1/2"
              }`}
            />
          )}
        </div>
      )}
    </div>
  );
}
