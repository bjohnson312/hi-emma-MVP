import { Home, Users, BarChart3, MessageSquare, Settings, LogOut, UserPlus, HelpCircle, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProviderView = 
  | "home" 
  | "patients" 
  | "analytics" 
  | "communications" 
  | "care-team"
  | "notes"
  | "settings"
  | "help";

interface ProviderSidebarProps {
  currentView: ProviderView;
  onNavigate: (view: ProviderView) => void;
  providerName: string;
  onLogout: () => void;
}

export default function ProviderSidebar({ 
  currentView, 
  onNavigate, 
  providerName,
  onLogout 
}: ProviderSidebarProps) {
  const navItems = [
    { id: "home" as ProviderView, label: "Dashboard", icon: Home },
    { id: "patients" as ProviderView, label: "Patients", icon: Users },
    { id: "analytics" as ProviderView, label: "Analytics", icon: BarChart3 },
    { id: "communications" as ProviderView, label: "Messages", icon: MessageSquare },
    { id: "care-team" as ProviderView, label: "Care Team", icon: UserPlus },
    { id: "notes" as ProviderView, label: "Notes", icon: FileText },
    { id: "settings" as ProviderView, label: "Settings", icon: Settings },
    { id: "help" as ProviderView, label: "Help", icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#6656cb]" />
          <h1 className="text-xl font-bold text-[#6656cb]">Provider Portal</h1>
        </div>
        <p className="text-sm text-gray-600">
          {providerName ? `Dr. ${providerName}` : "Healthcare Professional"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#6656cb] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
