import { 
  X, 
  Sun, 
  Moon, 
  Heart, 
  UtensilsCrossed, 
  Pill,
  TrendingUp,
  Award,
  Brain,
  Bell,
  Users,
  FileText,
  Share2,
  Settings,
  HelpCircle,
  Sparkles,
  Stethoscope,
  LogOut
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export default function MobileMenu({ isOpen, onClose, activeView, onNavigate, onLogout }: MobileMenuProps) {
  if (!isOpen) return null;

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const menuSections = [
    {
      title: "Daily Tracking",
      items: [
        { id: "morning-routine", label: "Morning Routine", icon: Sun },
        { id: "evening-routine", label: "Evening Routine", icon: Moon },
        { id: "mood", label: "Mood Check-In", icon: Heart },
        { id: "diet-nutrition", label: "Diet & Nutrition", icon: UtensilsCrossed },
        { id: "doctors-orders", label: "Medications", icon: Pill }
      ]
    },
    {
      title: "Insights & Progress",
      items: [
        { id: "progress", label: "Progress", icon: TrendingUp },
        { id: "insights", label: "Insights", icon: Sparkles },
        { id: "milestones", label: "Milestones", icon: Award },
        { id: "memories", label: "Memories", icon: Brain }
      ]
    },
    {
      title: "Care & Sharing",
      items: [
        { id: "care-team", label: "Care Team", icon: Users },
        { id: "provider-access", label: "Provider Access", icon: Stethoscope },
        { id: "export", label: "Export & Share", icon: Share2 }
      ]
    },
    {
      title: "Settings",
      items: [
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "help", label: "Help & Support", icon: HelpCircle }
      ]
    }
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#4e8f71] to-[#364d89] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Menu</h2>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/80 text-sm">Your wellness companion</p>
        </div>

        <div className="p-4 space-y-6 pb-20">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 text-[#4e8f71] font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-[#4e8f71]" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {onLogout && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Account
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
