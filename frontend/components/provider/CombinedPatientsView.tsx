import { useState } from "react";
import { Users, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PatientManagementView from "./PatientManagementView";
import EnhancedPatientList from "./EnhancedPatientList";

interface CombinedPatientsViewProps {
  onSelectPatient: (patientId: string) => void;
}

export default function CombinedPatientsView({ onSelectPatient }: CombinedPatientsViewProps) {
  const [showManagement, setShowManagement] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 overflow-hidden">
        <button
          onClick={() => setShowManagement(!showManagement)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-[#323e48]">Patient Records Management</h2>
              <p className="text-[#323e48]/70">Create, edit, and manage patient records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowManagement(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
            {showManagement ? (
              <ChevronUp className="w-6 h-6 text-[#323e48]/60" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[#323e48]/60" />
            )}
          </div>
        </button>

        {showManagement && (
          <div className="border-t border-[#323e48]/10 p-6 bg-gradient-to-br from-white to-gray-50/50">
            <PatientManagementView />
          </div>
        )}
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#323e48] mb-2">Patient Access List</h2>
          <p className="text-[#323e48]/70">
            Patients who have granted you access to their health data
          </p>
        </div>
        <EnhancedPatientList onSelectPatient={onSelectPatient} />
      </div>
    </div>
  );
}
