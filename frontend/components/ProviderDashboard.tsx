import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PatientList } from "./provider/PatientList";
import { PatientDetails } from "./provider/PatientDetails";
import { AuditLogViewer } from "./provider/AuditLogViewer";
import { LogOut, Users, FileText, Shield } from "lucide-react";

interface ProviderDashboardProps {
  token: string;
  providerData: any;
  onLogout: () => void;
}

export function ProviderDashboard({ token, providerData, onLogout }: ProviderDashboardProps) {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"patients" | "audit">("patients");

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
      
      <div className="relative z-10 min-h-screen">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#6656cb]" />
                <div>
                  <h1 className="text-2xl font-bold text-[#6656cb]">Provider Portal</h1>
                  <p className="text-sm text-gray-600">
                    {providerData?.fullName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setActiveView("patients");
                      setSelectedPatient(null);
                    }}
                    variant={activeView === "patients" ? "default" : "outline"}
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Patients
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveView("audit");
                      setSelectedPatient(null);
                    }}
                    variant={activeView === "audit" ? "default" : "outline"}
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Audit Logs
                  </Button>
                </div>
                
                <Button onClick={onLogout} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 min-h-[600px]">
            {activeView === "patients" ? (
              selectedPatient ? (
                <PatientDetails
                  token={token}
                  patientId={selectedPatient}
                  onBack={() => setSelectedPatient(null)}
                />
              ) : (
                <PatientList
                  token={token}
                  onSelectPatient={setSelectedPatient}
                />
              )
            ) : (
              <AuditLogViewer token={token} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
