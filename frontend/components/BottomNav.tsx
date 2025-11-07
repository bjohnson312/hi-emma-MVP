import { MessageCircle, BookOpen, Menu } from "lucide-react";

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onMenuOpen: () => void;
}

export default function BottomNav({ activeView, onNavigate, onMenuOpen }: BottomNavProps) {
  const tabs = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "menu", label: "Menu", icon: Menu }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => tab.id === "menu" ? onMenuOpen() : onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive
                  ? "text-[#4e8f71]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs mt-1 font-medium ${isActive ? "text-[#4e8f71]" : "text-gray-500"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
