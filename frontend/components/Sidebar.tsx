import { useState } from "react";
import {
  MessageCircle,
  Sun,
  Stethoscope,
  Apple,
  Smile,
  Moon,
  TrendingUp,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  Share2,
  BookOpen,
  Brain,
  Sparkles,
  Trophy,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import Tooltip from "@/components/Tooltip";

export type NavigationView = 
  | "home"
  | "morning-routine"
  | "doctors-orders"
  | "diet-nutrition"
  | "mood"
  | "evening-routine"
  | "wellness-journal"
  | "memories"
  | "progress"
  | "insights"
  | "milestones"
  | "notifications"
  | "care-team"
  | "provider-access"
  | "settings"
  | "export"
  | "help";

interface SidebarProps {
  currentView: NavigationView;
  onNavigate: (view: NavigationView) => void;
  userName?: string;
}

interface NavItem {
  id: NavigationView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "beta" | "coming-soon" | "experimental";
  tooltip: string;
}

const mainNavItems: NavItem[] = [
  { id: "home", label: "Home / Chat", icon: MessageCircle, tooltip: "Have a conversation with Emma about anything" },
  { id: "wellness-journal", label: "Wellness Journal", icon: BookOpen, badge: "beta", tooltip: "Track your daily health & wellness journey" },
  { id: "morning-routine", label: "Morning Routine", icon: Sun, tooltip: "Start your day with a guided check-in" },
  { id: "doctors-orders", label: "Doctor's Orders", icon: Stethoscope, badge: "beta", tooltip: "Manage medications and treatment plans" },
  { id: "diet-nutrition", label: "Diet & Nutrition", icon: Apple, badge: "beta", tooltip: "Log meals and track nutrition goals" },
  { id: "mood", label: "How Are You Feeling", icon: Smile, badge: "beta", tooltip: "Check in with your emotional wellbeing" },
  { id: "evening-routine", label: "Evening Routine", icon: Moon, badge: "beta", tooltip: "Wind down with a reflective evening routine" }
];

const bottomNavItems: NavItem[] = [
  { id: "progress", label: "My Progress", icon: TrendingUp, badge: "beta", tooltip: "See how your wellness journey is evolving" },
  { id: "insights", label: "Insights", icon: Sparkles, badge: "beta", tooltip: "Discover patterns in your health data" },
  { id: "milestones", label: "Milestones", icon: Trophy, badge: "beta", tooltip: "Celebrate achievements in your wellness journey" },
  { id: "memories", label: "Emma's Memory", icon: Brain, tooltip: "View what Emma remembers about you" },
  { id: "care-team", label: "Care Team", icon: Users, tooltip: "Manage your support network and caregivers" },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "beta", tooltip: "Set up reminders for check-ins and medications" },
  { id: "provider-access", label: "Provider Access", icon: Shield, badge: "beta", tooltip: "Share your data with healthcare providers" },
  { id: "settings", label: "Settings", icon: Settings, tooltip: "Customize Emma's voice and preferences" },
  { id: "export", label: "Export & Share", icon: Share2, tooltip: "Download or share your wellness reports" },
  { id: "help", label: "Help / About Emma", icon: HelpCircle, tooltip: "Learn more about Emma and get support" }
];

export default function Sidebar({ currentView, onNavigate, userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleNavigate = (view: NavigationView) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-white/40"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#4e8f71]" />
        ) : (
          <Menu className="w-6 h-6 text-[#4e8f71]" />
        )}
      </button>

      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-[#4e8f71] via-[#364d89] to-[#6656cb]
          shadow-2xl z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-72 lg:w-80
        `}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <img 
                  src="/logo.png" 
                  alt="Emma" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-lg font-medium text-white">
                {getGreeting()}{userName ? `, ${userName}` : ""} ☀️
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2" aria-label="Main navigation">
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <Tooltip key={item.id} content={item.tooltip} side="right" >
                    <button
                      onClick={() => handleNavigate(item.id)}
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
                          {item.badge === "beta" ? "Beta" : item.badge === "coming-soon" ? "Soon" : "Exp"}
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
                  <Tooltip key={item.id} content={item.tooltip} side="right" >
                    <button
                      onClick={() => handleNavigate(item.id)}
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
                          {item.badge === "beta" ? "Beta" : item.badge === "coming-soon" ? "Soon" : "Exp"}
                        </StatusBadge>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
