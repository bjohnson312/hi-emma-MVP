import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { LogOut, Users, FileText, MessageSquare, Activity, Shield } from "lucide-react";
import { PatientList } from "./provider/PatientList";
import { PatientDetails } from "./provider/PatientDetails";
import { AuditLogViewer } from "./provider/AuditLogViewer";

interface ProviderDashboardProps {
  token: string;
  providerData: any;
  onLogout: () => void;
}

export function ProviderDashboard({ token, providerData, onLogout }: ProviderDashboardProps) {
  const [activeView, setActiveView] = useState<"patients" | "audit">("patients");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Provider Portal
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {providerData.fullName} • {providerData.role}
            </p>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveView("patients");
                setSelectedPatientId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === "patients"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>My Patients</span>
            </button>

            <button
              onClick={() => {
                setActiveView("audit");
                setSelectedPatientId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === "audit"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Audit Logs</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          {activeView === "patients" && !selectedPatientId && (
            <PatientList
              token={token}
              onSelectPatient={setSelectedPatientId}
            />
          )}

          {activeView === "patients" && selectedPatientId && (
            <PatientDetails
              token={token}
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          )}

          {activeView === "audit" && (
            <AuditLogViewer token={token} />
          )}
        </main>
      </div>
    </div>
  );
}
