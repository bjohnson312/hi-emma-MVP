import { Home, Users, BarChart3, MessageSquare, Settings, LogOut, UserPlus, HelpCircle, FileText, Shield } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import Tooltip from "@/components/Tooltip";

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

interface NavItem {
  id: ProviderView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "beta" | "coming-soon";
  tooltip: string;
}

const mainNavItems: NavItem[] = [
  { id: "home", label: "Dashboard", icon: Home, tooltip: "Overview of patients and alerts" },
  { id: "patients", label: "Patients", icon: Users, tooltip: "View and manage patient list" },
  { id: "analytics", label: "Analytics", icon: BarChart3, badge: "beta", tooltip: "Reports and insights across patients" },
  { id: "communications", label: "Messages", icon: MessageSquare, tooltip: "Secure messaging with patients" },
  { id: "care-team", label: "Care Team", icon: UserPlus, tooltip: "Manage providers and team members" },
  { id: "notes", label: "Notes", icon: FileText, badge: "coming-soon", tooltip: "Clinical notes and documentation" },
];

const bottomNavItems: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings, tooltip: "Configure preferences and profile" },
  { id: "help", label: "Help / Resources", icon: HelpCircle, tooltip: "Get support and learning resources" },
];

export default function ProviderSidebar({ 
  currentView, 
  onNavigate, 
  providerName,
  onLogout 
}: ProviderSidebarProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <aside
      className="
        hidden md:flex md:flex-col
        sticky top-0 left-0 h-screen
        bg-gradient-to-b from-[#4e8f71] via-[#364d89] to-[#6656cb]
        shadow-2xl
        w-72 lg:w-80
      "
    >
      <div className="flex flex-col h-full p-6">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-10 h-10 text-white" />
                <div className="text-white">
                  <p className="text-xs font-medium">Provider Portal</p>
                  <p className="text-lg font-bold">Hi, Emma</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-lg font-medium text-white">
              {getGreeting()}, {providerName ? `Dr. ${providerName}` : "Doctor"} 👨‍⚕️
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-2" aria-label="Main navigation">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <Tooltip key={item.id} content={item.tooltip} side="right">
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? "bg-white/30 backdrop-blur-sm text-white shadow-lg"
                        : "text-white/90 hover:bg-white/15 hover:shadow-md"
                      }
                    `}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <StatusBadge variant={item.badge} className="text-[10px] px-1.5 py-0">
                        {item.badge === "beta" ? "Beta" : "Soon"}
                      </StatusBadge>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-white/30">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <Tooltip key={item.id} content={item.tooltip} side="right">
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? "bg-white/30 backdrop-blur-sm text-white shadow-lg"
                        : "text-white/90 hover:bg-white/15 hover:shadow-md"
                      }
                    `}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <StatusBadge variant={item.badge} className="text-[10px] px-1.5 py-0">
                        {item.badge === "beta" ? "Beta" : "Soon"}
                      </StatusBadge>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </nav>

        <div className="pt-4 mt-4 border-t border-white/30">
          <Tooltip content="Sign out of your account" side="right">
            <button
              onClick={onLogout}
              className="
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                text-white/90 hover:bg-red-500/20 hover:text-white hover:shadow-md
              "
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm flex-1 text-left">Log Out</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
