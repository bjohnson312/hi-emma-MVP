import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { PatientListItem } from "~backend/provider_portal/list_patients";
import { Users, Search, Calendar, Activity } from "lucide-react";

interface PatientListProps {
  token: string;
  onSelectPatient: (patientId: string) => void;
}

export function PatientList({ token, onSelectPatient }: PatientListProps) {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await backend.provider_portal.listPatients({
        token,
      });
      setPatients(data.patients);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading patients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          My Patients
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients..."
            className="pl-10"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? "No patients found" : "No patients yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.userId}
              onClick={() => onSelectPatient(patient.userId)}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {patient.fullName}
                  </h3>
                  {patient.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {patient.email}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      Access: {new Date(patient.grantedAt).toLocaleDateString()}
                    </div>
                    {patient.lastActivity && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Activity className="w-4 h-4 mr-1" />
                        Last activity: {new Date(patient.lastActivity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.accessLevel === "full"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : patient.accessLevel === "write"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}>
                    {patient.accessLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
