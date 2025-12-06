import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, Link as LinkIcon, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { PatientListItem } from "~backend/patients/types";

export default function PatientManagementView() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);
    try {
      const token = localStorage.getItem("provider_token") || "";
      const response = await backend.patients.listPatients({ 
        token,
        search: searchTerm || undefined
      });
      setPatients(response.patients);
    } catch (error) {
      console.error("Failed to load patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadPatients();
  }

  function handleAddPatient() {
    setShowAddModal(true);
  }

  function handleEditPatient(patient: PatientListItem) {
    setSelectedPatient(patient);
    setShowEditModal(true);
  }

  async function handleDeletePatient(patientId: string, patientName: string) {
    if (!confirm(`Are you sure you want to deactivate ${patientName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("provider_token") || "";
      await backend.patients.deletePatient({ 
        token,
        patient_id: patientId,
        permanent: false
      });

      toast({
        title: "Patient Deactivated",
        description: `${patientName} has been deactivated.`
      });

      loadPatients();
    } catch (error) {
      console.error("Failed to delete patient:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate patient.",
        variant: "destructive"
      });
    }
  }

  function handleModalClose() {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedPatient(null);
    loadPatients();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or MRN..."
              className="bg-white"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={handleAddPatient}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-[#323e48]/60">
            <Users className="w-16 h-16 mx-auto mb-4 text-[#323e48]/30" />
            <p className="text-lg mb-2">No patients found</p>
            <p className="text-sm mb-4">Add your first patient to get started</p>
            <Button 
              onClick={handleAddPatient}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-[#323e48]/10 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#323e48] text-lg mb-1">{patient.full_name}</h3>
                    {patient.email && (
                      <p className="text-sm text-[#323e48]/60">{patient.email}</p>
                    )}
                    {patient.phone && (
                      <p className="text-sm text-[#323e48]/60">{patient.phone}</p>
                    )}
                    {patient.medical_record_number && (
                      <p className="text-xs text-[#323e48]/50 mt-1">MRN: {patient.medical_record_number}</p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    patient.has_app_access 
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {patient.has_app_access ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        App User
                      </span>
                    ) : (
                      "Record Only"
                    )}
                  </div>
                </div>

                {patient.last_activity && (
                  <p className="text-xs text-[#323e48]/50 mb-3">
                    Last activity: {new Date(patient.last_activity).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditPatient(patient)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeletePatient(patient.id, patient.full_name)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <PatientFormModal onClose={handleModalClose} />}
      {showEditModal && selectedPatient && (
        <PatientFormModal patient={selectedPatient} onClose={handleModalClose} />
      )}
    </div>
  );
}

interface PatientFormModalProps {
  patient?: PatientListItem;
  onClose: () => void;
}

function PatientFormModal({ patient, onClose }: PatientFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || "",
    email: patient?.email || "",
    phone: patient?.phone || "",
    date_of_birth: "",
    medical_record_number: patient?.medical_record_number || "",
    address: "",
    notes: ""
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("provider_token") || "";

      if (patient) {
        await backend.patients.updatePatient({
          token,
          patient_id: patient.id,
          ...formData
        });
        toast({
          title: "Patient Updated",
          description: "Patient information has been updated successfully."
        });
      } else {
        await backend.patients.createPatient({
          token,
          ...formData
        });
        toast({
          title: "Patient Added",
          description: "New patient has been added successfully."
        });
      }

      onClose();
    } catch (error: any) {
      console.error("Failed to save patient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save patient.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#323e48]">
            {patient ? "Edit Patient" : "Add New Patient"}
          </h2>
          <button onClick={onClose} className="text-[#323e48]/60 hover:text-[#323e48]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">
              Full Name *
            </label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Date of Birth
              </label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#323e48] mb-2">
                Medical Record Number
              </label>
              <Input
                value={formData.medical_record_number}
                onChange={(e) => setFormData({ ...formData, medical_record_number: e.target.value })}
                placeholder="MRN-12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">
              Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the patient..."
              className="w-full px-3 py-2 bg-white border border-[#323e48]/20 rounded-lg min-h-[100px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                patient ? "Update Patient" : "Add Patient"
              )}
            </Button>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
