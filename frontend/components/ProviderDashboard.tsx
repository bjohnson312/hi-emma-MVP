import { useState } from "react";
import ProviderSidebar, { type ProviderView } from "./provider/ProviderSidebar";
import HomeDashboard from "./provider/HomeDashboard";
import EnhancedPatientList from "./provider/EnhancedPatientList";
import PatientProfileView from "./provider/PatientProfileView";
import AnalyticsView from "./provider/AnalyticsView";
import CareTeamView from "./provider/CareTeamView";
import CommunicationsView from "./provider/CommunicationsView";
import ProviderSettingsView from "./provider/ProviderSettingsView";
import HelpView from "./provider/HelpView";

interface ProviderDashboardProps {
  token: string;
  providerData: any;
  onLogout: () => void;
}

export function ProviderDashboard({ token, providerData, onLogout }: ProviderDashboardProps) {
  const [currentView, setCurrentView] = useState<ProviderView>("home");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const renderMainContent = () => {
    if (selectedPatient) {
      return (
        <PatientProfileView
          patientId={selectedPatient}
          onBack={() => setSelectedPatient(null)}
        />
      );
    }

    switch (currentView) {
      case "home":
        return <HomeDashboard />;
      case "patients":
        return <EnhancedPatientList onSelectPatient={setSelectedPatient} />;
      case "analytics":
        return <AnalyticsView />;
      case "communications":
        return <CommunicationsView />;
      case "care-team":
        return <CareTeamView />;
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
        return <HomeDashboard />;
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
        <ProviderSidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setSelectedPatient(null);
          }}
          providerName={providerData?.fullName?.split(' ')[1] || "Provider"}
          onLogout={onLogout}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
