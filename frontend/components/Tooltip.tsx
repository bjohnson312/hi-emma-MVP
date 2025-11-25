import { useState, ReactNode, useEffect, useRef } from "react";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  autoHideDelay?: number;
}

export default function Tooltip({ children, content, side = "top", autoHideDelay = 3000 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const showTooltipWithTimer = () => {
    setIsVisible(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);
  };

  const hideTooltip = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={showTooltipWithTimer}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gradient-to-br from-[#4e8f71] to-[#364d89] rounded-xl shadow-2xl whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200 ${
            side === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" :
            side === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" :
            side === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" :
            "left-full top-1/2 -translate-y-1/2 ml-2"
          }`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-[#4e8f71] rotate-45 ${
              side === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" :
              side === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" :
              side === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" :
              "left-[-4px] top-1/2 -translate-y-1/2"
            }`}
          />
        </div>
      )}
    </div>
  );
}
