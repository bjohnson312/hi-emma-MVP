import { useState } from "react";
import ProviderSidebar, { type ProviderView } from "./provider/ProviderSidebar";
import ProviderChatView from "./provider/ProviderChatView";
import HomeDashboard from "./provider/HomeDashboard";
import EnhancedPatientList from "./provider/EnhancedPatientList";
import PatientProfileView from "./provider/PatientProfileView";
import AnalyticsView from "./provider/AnalyticsView";
import CareTeamView from "./provider/CareTeamView";
import CommunicationsView from "./provider/CommunicationsView";
import ProviderSettingsView from "./provider/ProviderSettingsView";
import HelpView from "./provider/HelpView";
import VisitsView from "./provider/VisitsView";
import AppointmentDetailView from "./provider/AppointmentDetailView";
import ProviderCarePlansView from "./provider/ProviderCarePlansView";
import { MessageCircle, Home as HomeIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProviderDashboardProps {
  token: string;
  providerData: any;
  onLogout: () => void;
}

export function ProviderDashboard({ token, providerData, onLogout }: ProviderDashboardProps) {
  const [currentView, setCurrentView] = useState<ProviderView>("chat");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const renderMainContent = () => {
    if (selectedPatient) {
      return (
        <PatientProfileView
          patientId={selectedPatient}
          onBack={() => setSelectedPatient(null)}
        />
      );
    }

    if (selectedAppointment) {
      return (
        <AppointmentDetailView
          appointmentId={selectedAppointment}
          onBack={() => setSelectedAppointment(null)}
        />
      );
    }

    switch (currentView) {
      case "chat":
        return <ProviderChatView />;
      case "home":
        return <HomeDashboard />;
      case "patients":
        return <EnhancedPatientList onSelectPatient={setSelectedPatient} />;
      case "visits":
        return <VisitsView onSelectAppointment={setSelectedAppointment} />;
      case "analytics":
        return <AnalyticsView />;
      case "communications":
        return <CommunicationsView />;
      case "care-team":
        return <CareTeamView />;
      case "care-plans":
        return <ProviderCarePlansView />;
      case "notes":
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Clinical notes view - Coming soon</p>
          </div>
        );
      case "settings":
        return <ProviderSettingsView />;
      case "help":
        return <HelpView />;
      default:
        return <ProviderChatView />;
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
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
        
        <div className={`${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300`}>
          <ProviderSidebar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              setSelectedPatient(null);
              setShowMobileMenu(false);
            }}
            providerName={providerData?.fullName?.split(' ')[1] || "Provider"}
            providerId={providerData?.id}
            onLogout={onLogout}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            {renderMainContent()}
          </div>
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#4e8f71] via-[#364d89] to-[#6656cb] border-t border-white/20 z-30">
        <div className="flex items-center justify-around px-4 py-3">
          <Button
            onClick={() => {
              setCurrentView("chat");
              setSelectedPatient(null);
            }}
            variant="ghost"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              currentView === "chat"
                ? "bg-white/30 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Chat</span>
          </Button>
          <Button
            onClick={() => {
              setCurrentView("home");
              setSelectedPatient(null);
            }}
            variant="ghost"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              currentView === "home"
                ? "bg-white/30 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Button>
          <Button
            onClick={() => setShowMobileMenu(true)}
            variant="ghost"
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">Menu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
