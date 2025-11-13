import { useState, useEffect } from "react";
import ConversationalCheckIn from "./components/ConversationalCheckIn";
import MicrophoneSetup from "./components/MicrophoneSetup";
import OnboardingFlow from "./components/OnboardingFlow";
import Sidebar, { type NavigationView } from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import MobileMenu from "./components/MobileMenu";
import MorningRoutineView from "./components/views/MorningRoutineView";
import DoctorsOrdersView from "./components/views/DoctorsOrdersView";
import DietNutritionView from "./components/views/DietNutritionView";
import MoodView from "./components/views/MoodView";
import EveningRoutineView from "./components/views/EveningRoutineView";
import WellnessJournalView from "./components/views/WellnessJournalView";
import MemoriesView from "./components/views/MemoriesView";
import ProgressView from "./components/views/ProgressView";
import NotificationsView from "./components/views/NotificationsView";
import SettingsView from "./components/views/SettingsView";
import HelpView from "./components/views/HelpView";
import ExportView from "./components/views/ExportView";
import SharedReportView from "./components/views/SharedReportView";
import { ClerkLoginPage } from "./components/ClerkLoginPage";
import { InsightsView } from "./components/views/InsightsView";
import { MilestonesView } from "./components/views/MilestonesView";
import { ProviderAccessView } from "./components/views/ProviderAccessView";
import { CareTeamView } from "./components/views/CareTeamView";
import { Toaster } from "@/components/ui/toaster";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import { clerkClient } from "./lib/clerk-client";
import AdminPortalApp from "./AdminPortalApp";
import backend from "~backend/client";

function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const swUrl = `${window.location.origin}/sw.js`;
        const response = await fetch(swUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          console.warn('⚠️ Service Worker file not found, skipping registration');
          return;
        }
        
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          type: 'classic'
        });
        
        console.log('✅ Service Worker registered successfully:', registration.scope);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<NavigationView>("home");
  const [userName, setUserName] = useState<string>("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [showMicSetup, setShowMicSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  const [userId, setUserId] = useState(() => {
    const stored = localStorage.getItem("emma_user_id");
    return stored || "";
  });

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (clerkClient.isSignedIn()) {
        const user = await clerkClient.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setUserId(user.id);
          setUserEmail(user.email_addresses[0]?.email_address || "");
          await checkOnboardingStatus(user.id);
          return;
        }
      }
      
      const storedAuth = localStorage.getItem("emma_authenticated");
      const storedEmail = localStorage.getItem("emma_user_email");
      const storedUserId = localStorage.getItem("emma_user_id");
      
      if (storedAuth === "true" && storedUserId) {
        setIsAuthenticated(true);
        setUserId(storedUserId);
        setUserEmail(storedEmail || "");
        await checkOnboardingStatus(storedUserId);
      }
    };
    
    checkAuth();
  }, []);

  const checkOnboardingStatus = async (uid: string) => {
    try {
      const status = await backend.onboarding.getStatus({ user_id: uid });
      if (!status.onboarding_completed) {
        setShowOnboarding(true);
      } else if (status.preferences?.first_name) {
        setUserName(status.preferences.first_name);
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  useNotificationPolling(userId, isAuthenticated);

  const handleLoginSuccess = async (userId: string, email: string, isNewSignup?: boolean) => {
    setUserId(userId);
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem("emma_user_id", userId);
    localStorage.setItem("emma_user_email", email);
    localStorage.setItem("emma_authenticated", "true");

    try {
      await backend.admin_portal.logAccess({ userId, action: "login" });
    } catch (error) {
      console.error("Failed to log access:", error);
    }

    if (isNewSignup) {
      setShowOnboarding(true);
    } else {
      await checkOnboardingStatus(userId);
    }
  };

  const ensureTrinityVoiceDefault = async () => {
    try {
      const savedVoiceType = localStorage.getItem('emma-voice-type');
      if (!savedVoiceType) {
        console.log('No saved voice preference, setting Trinity as default...');
        const { voices } = await backend.voice.listVoices();
        const trinityVoice = voices.find(v => v.name.toLowerCase().includes('trinity'));
        if (trinityVoice) {
          console.log('Setting Trinity voice:', trinityVoice.name);
          localStorage.setItem('emma-voice-preference', trinityVoice.name);
          localStorage.setItem('emma-voice-type', 'elevenlabs');
          localStorage.setItem('emma-voice-id', trinityVoice.id);
        } else {
          console.warn('Trinity voice not found in ElevenLabs voices. Available:', voices.map(v => v.name));
        }
      } else {
        console.log('Voice preference already set:', savedVoiceType);
      }
    } catch (error) {
      console.error('Failed to set Trinity voice:', error);
    }
  };

  const handleLogout = () => {
    clerkClient.signOut();
    setIsAuthenticated(false);
    setUserId("");
    setUserEmail("");
    setUserName("");
    setCurrentView("home");
    localStorage.removeItem("emma_user_id");
    localStorage.removeItem("emma_user_email");
    localStorage.removeItem("emma_authenticated");
  };

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/shared\/([a-f0-9]+)$/);
    if (match) {
      setShareToken(match[1]);
    }
    
    registerServiceWorker();
  }, []);





  if (shareToken) {
    return (
      <>
        <SharedReportView shareToken={shareToken} />
        <Toaster />
      </>
    );
  }

  if (showAdminPortal) {
    return (
      <>
        <AdminPortalApp onBackToSignIn={() => setShowAdminPortal(false)} />
        <Toaster />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ClerkLoginPage 
          onLoginSuccess={handleLoginSuccess}
          onAdminClick={() => setShowAdminPortal(true)}
        />
        <Toaster />
      </>
    );
  }

  if (showOnboarding) {
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-[#e8f5e9]/50 to-[#d6f0c2]/50 backdrop-blur-[1px]"></div>
        <div className="relative z-10">
          <OnboardingFlow 
            userId={userId} 
            onComplete={async (firstName) => {
              setUserName(firstName);
              setShowOnboarding(false);
              await ensureTrinityVoiceDefault();
              setShowMicSetup(true);
            }} 
          />
        </div>
        <Toaster />
      </div>
    );
  }

  if (showMicSetup) {
    return (
      <div 
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-[#e8f5e9]/50 to-[#d6f0c2]/50 backdrop-blur-[1px]"></div>
        <div className="relative z-10">
          <MicrophoneSetup onComplete={async () => {
            await ensureTrinityVoiceDefault();
            localStorage.setItem('emma_mic_setup_complete', 'true');
            setShowMicSetup(false);
          }} />
        </div>
        <Toaster />
      </div>
    );
  }



  const handleMobileNavigate = (view: string) => {
    if (view === "chat") {
      setCurrentView("home");
    } else if (view === "journal") {
      setCurrentView("wellness-journal");
    }
  };

  const getMobileView = () => {
    if (currentView === "home") return "chat";
    if (currentView === "wellness-journal") return "journal";
    return "menu";
  };

  const renderMainContent = () => {
    const personalizedTitle = userName ? `${userName}'s Daily Check-In` : "Daily Check-In";
    
    switch (currentView) {
      case "home":
        return <ConversationalCheckIn userId={userId} sessionType="morning" title={personalizedTitle} onNameUpdate={setUserName} />;
      case "morning-routine":
        return <MorningRoutineView userId={userId} />;
      case "doctors-orders":
        return <DoctorsOrdersView userId={userId} />;
      case "diet-nutrition":
        return <DietNutritionView userId={userId} />;
      case "mood":
        return <MoodView userId={userId} />;
      case "evening-routine":
        return <EveningRoutineView userId={userId} />;
      case "wellness-journal":
        return <WellnessJournalView userId={userId} onNavigate={(view) => setCurrentView(view as NavigationView)} />;
      case "memories":
        return <MemoriesView userId={userId} />;
      case "progress":
        return <ProgressView onNavigate={(view) => setCurrentView(view as NavigationView)} />;
      case "insights":
        return <InsightsView />;
      case "milestones":
        return <MilestonesView />;
      case "care-team":
        return <CareTeamView userId={userId} />;
      case "notifications":
        return <NotificationsView />;
      case "settings":
        return <SettingsView onOpenMicSetup={() => {
          localStorage.removeItem('emma_mic_setup_complete');
          setShowMicSetup(true);
        }} />;
      case "export":
        return <ExportView />;
      case "provider-access":
        return <ProviderAccessView userId={userId} />;
      case "help":
        return <HelpView />;
      default:
        return <ConversationalCheckIn userId={userId} sessionType="morning" title="Daily Check-In" onNameUpdate={setUserName} />;
    }
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-[#e8f5e9]/50 to-[#d6f0c2]/50 backdrop-blur-[1px]"></div>
      
      <div className="relative z-10 flex h-screen">
        <Sidebar 
          currentView={currentView} 
          onNavigate={setCurrentView}
          userName={userName}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            {renderMainContent()}
          </div>
        </main>
      </div>
      
      <BottomNav 
        activeView={getMobileView()}
        onNavigate={handleMobileNavigate}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />
      
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeView={currentView}
        onNavigate={(view) => setCurrentView(view as NavigationView)}
        onLogout={handleLogout}
      />
      
      <Toaster />
    </div>
  );
}
