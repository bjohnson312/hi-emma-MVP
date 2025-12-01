import { useState, useEffect } from "react";
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
  Users,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import Tooltip from "@/components/Tooltip";
import backend from "@/lib/backend-client";
import { USE_NEW_GREETING_FLOW } from "@/config";

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
  userId?: string;
  onLogout?: () => void;
}

interface NavItem {
  id: NavigationView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "beta" | "coming-soon" | "experimental";
  tooltip: string;
}

const dailyUseItems: NavItem[] = [
  { id: "home", label: "Chat", icon: MessageCircle, tooltip: "Have a conversation with Emma about anything" },
  { id: "wellness-journal", label: "Wellness Journal", icon: BookOpen, tooltip: "Track your daily health & wellness journey" },
  { id: "morning-routine", label: "Morning Routine", icon: Sun, tooltip: "Start your day with a guided check-in" },
  { id: "doctors-orders", label: "Doctor's Orders", icon: Stethoscope, tooltip: "Manage medications and treatment plans" },
  { id: "diet-nutrition", label: "Diet & Nutrition", icon: Apple, tooltip: "Log meals and track nutrition goals" },
  { id: "mood", label: "Mood Check-In", icon: Smile, tooltip: "Check in with your emotional wellbeing" },
  { id: "evening-routine", label: "Evening Routine", icon: Moon, tooltip: "Wind down with a reflective evening routine" }
];

const insightsProgressItems: NavItem[] = [
  { id: "progress", label: "My Progress", icon: TrendingUp, tooltip: "See how your wellness journey is evolving" },
  { id: "milestones", label: "Milestones", icon: Trophy, tooltip: "Celebrate achievements in your wellness journey" },
  { id: "memories", label: "Emma's Memory", icon: Brain, tooltip: "View what Emma remembers about you" },
  { id: "insights", label: "Insights", icon: Sparkles, tooltip: "Discover patterns in your health data" }
];

const careSharingItems: NavItem[] = [
  { id: "care-team", label: "Care Team", icon: Users, tooltip: "Manage your support network and caregivers" },
  { id: "provider-access", label: "Provider Access", icon: Shield, tooltip: "Share your data with healthcare providers" },
  { id: "export", label: "Export & Share", icon: Share2, tooltip: "Download or share your wellness reports" }
];

const settingsItems: NavItem[] = [
  { id: "notifications", label: "Notifications", icon: Bell, tooltip: "Set up reminders for check-ins and medications" },
  { id: "settings", label: "Settings", icon: Settings, tooltip: "Customize Emma's voice and preferences" },
  { id: "help", label: "Help & Support", icon: HelpCircle, tooltip: "Learn more about Emma and get support" }
];

export default function Sidebar({ currentView, onNavigate, userName, userId, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [greeting, setGreeting] = useState("Hi");
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchGreeting = async () => {
      if (USE_NEW_GREETING_FLOW && userId) {
        try {
          const response = await backend.api_v2_gateway.currentContext({ userId });
          setGreeting(response.greeting);
        } catch (error) {
          console.error("Failed to fetch greeting:", error);
          setGreeting("Hi");
        }
      } else {
        setGreeting(getGreeting());
      }
    };
    fetchGreeting();
  }, [userId]);

  const handleNavigate = (view: NavigationView) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      <div
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
                <img 
                  src="/logo.png" 
                  alt="Emma" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-lg font-medium text-white">
                {greeting}{userName ? `, ${userName}` : ""} ☀️
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 pb-4" aria-label="Main navigation">
            <div className="space-y-1">
              <div className="px-2 pb-1">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Daily Use</h3>
              </div>
              {dailyUseItems.map((item) => {
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
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-white/30 space-y-1">
              <div className="px-2 pb-1">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Insights & Progress</h3>
              </div>
              {insightsProgressItems.map((item) => {
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
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-white/30 space-y-1">
              <div className="px-2 pb-1">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Care & Sharing</h3>
              </div>
              {careSharingItems.map((item) => {
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
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-white/30 space-y-1">
              <div className="px-2 pb-1">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Settings</h3>
              </div>
              {settingsItems.map((item) => {
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
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </nav>

          {onLogout && (
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
          )}
        </div>
      </div>

    </>
  );
}
