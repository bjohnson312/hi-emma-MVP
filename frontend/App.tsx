import { useState, useEffect } from "react";
import ConversationalCheckIn from "./components/ConversationalCheckIn";
import MicrophoneSetup from "./components/MicrophoneSetup";
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
import { InsightsView } from "./components/views/InsightsView";
import { MilestonesView } from "./components/views/MilestonesView";
import { ProviderAccessView } from "./components/views/ProviderAccessView";
import { CareTeamView } from "./components/views/CareTeamView";
import { Toaster } from "@/components/ui/toaster";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import { ClerkProvider, SignedIn, SignedOut, SignIn, useClerk } from "./lib/clerk";

function AppInner() {
  const { user } = useClerk();
  const [currentView, setCurrentView] = useState<NavigationView>("home");
  const [userName, setUserName] = useState<string>("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [showMicSetup, setShowMicSetup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userId = user?.id || "";

  useNotificationPolling(userId, !!user);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/shared\/([a-f0-9]+)$/);
    if (match) {
      setShareToken(match[1]);
    }
  }, []);

  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('emma_mic_setup_complete');
    const isSpeechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    if (!hasCompletedSetup && isSpeechSupported && !shareToken) {
      setShowMicSetup(true);
    }
  }, [shareToken]);



  if (shareToken) {
    return (
      <>
        <SharedReportView shareToken={shareToken} />
        <Toaster />
      </>
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
          <MicrophoneSetup onComplete={() => {
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
        return <MorningRoutineView />;
      case "doctors-orders":
        return <DoctorsOrdersView userId={userId} />;
      case "diet-nutrition":
        return <DietNutritionView userId={userId} />;
      case "mood":
        return <MoodView userId={userId} />;
      case "evening-routine":
        return <EveningRoutineView userId={userId} />;
      case "wellness-journal":
        return <WellnessJournalView userId={userId} />;
      case "memories":
        return <MemoriesView userId={userId} />;
      case "progress":
        return <ProgressView />;
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
      />
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider>
      <SignedOut>
        <div 
          className="min-h-screen flex items-center justify-center px-4 relative"
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
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#6656cb] mb-2">Hi, Emma</h1>
              <p className="text-[#4e8f71]">Your personal wellness companion</p>
            </div>
            <SignIn />
          </div>
          <Toaster />
        </div>
      </SignedOut>
      <SignedIn>
        <AppInner />
      </SignedIn>
    </ClerkProvider>
  );
}
