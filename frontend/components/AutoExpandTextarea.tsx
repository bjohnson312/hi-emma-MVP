import { useRef, useEffect, forwardRef } from "react";

interface AutoExpandTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const AutoExpandTextarea = forwardRef<HTMLTextAreaElement, AutoExpandTextareaProps>(
  ({ value, onChange, onSend, placeholder, disabled, className = "" }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, window.innerWidth < 768 ? 220 : 260);
      textarea.style.height = newHeight + 'px';
    }, [value, textareaRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={`
          resize-none 
          overflow-y-auto 
          min-h-[3rem] 
          max-h-[220px] 
          md:max-h-[260px]
          border 
          border-white/40 
          focus:border-[#4e8f71] 
          focus:ring-[#4e8f71]/20 
          rounded-2xl 
          px-4 
          py-3 
          bg-white/90 
          backdrop-blur-sm 
          shadow-lg
          focus:outline-none 
          focus:ring-2
          w-full
          ${className}
        `}
        style={{
          transition: 'height 0.08s ease',
          height: 'auto'
        }}
      />
    );
  }
);

AutoExpandTextarea.displayName = 'AutoExpandTextarea';

export default AutoExpandTextarea;
