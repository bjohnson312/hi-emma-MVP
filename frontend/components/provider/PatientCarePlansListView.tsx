import { useState, useEffect } from "react";
import { Heart, MessageSquare, Edit, Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { PatientWithPlan } from "~backend/care_plans/list_patients_with_plans";
import type { CarePlanWithTasks } from "~backend/care_plans/types";
import { logErrorSilently } from "@/lib/silent-error-handler";

interface Props {
  onBack: () => void;
  onEditPlan: (patientId: string, plan: CarePlanWithTasks) => void;
}

export default function PatientCarePlansListView({ onBack, onEditPlan }: Props) {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientWithPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [smsModal, setSmsModal] = useState<{ open: boolean; patient: PatientWithPlan | null }>({
    open: false,
    patient: null
  });
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);
    try {
      const token = localStorage.getItem("provider_token") || "";
      const response = await backend.care_plans.listPatientsWithPlans({ token });
      setPatients(response.patients);
    } catch (error) {
      await logErrorSilently(error, {
        componentName: 'PatientCarePlansListView',
        errorType: 'api_failure',
        severity: 'low',
      });
      toast({
        title: "Unable to load patients",
        description: "Please try again in a moment",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEditPlan(patient: PatientWithPlan) {
    setLoading(true);
    try {
      const response = await backend.care_plans.getPatientPlan({ patient_id: patient.patient_id });
      if (response.plan) {
        onEditPlan(patient.patient_id, response.plan);
      } else {
        toast({
          title: "Error",
          description: "Care plan not found.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to load care plan:", error);
      toast({
        title: "Error",
        description: "Failed to load care plan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function openSmsModal(patient: PatientWithPlan) {
    setSmsModal({ open: true, patient });
    setSmsMessage("");
  }

  function closeSmsModal() {
    setSmsModal({ open: false, patient: null });
    setSmsMessage("");
  }

  async function handleSendSms() {
    if (!smsModal.patient || !smsMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      });
      return;
    }

    if (!smsModal.patient.patient_phone) {
      toast({
        title: "No Phone Number",
        description: "This patient does not have a phone number on file.",
        variant: "destructive"
      });
      return;
    }

    setSendingSms(true);
    try {
      const token = localStorage.getItem("provider_token") || "";
      await backend.care_plans.sendPatientSMS({
        token,
        patient_id: smsModal.patient.patient_id,
        message: smsMessage
      });

      toast({
        title: "SMS Sent",
        description: `Message sent to ${smsModal.patient.patient_name}.`
      });

      closeSmsModal();
    } catch (error: any) {
      console.error("Failed to send SMS:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send SMS.",
        variant: "destructive"
      });
    } finally {
      setSendingSms(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#323e48]/60 hover:text-[#323e48] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#323e48]">Patients with Care Plans</h1>
            <p className="text-[#323e48]/70">Manage and communicate with patients</p>
          </div>
        </div>
      </div>

      {loading && !smsModal.open ? (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-pink-500" />
          <p className="text-[#323e48]/60">Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-[#323e48]/30" />
          <h3 className="text-xl font-bold text-[#323e48] mb-2">No Care Plans Yet</h3>
          <p className="text-[#323e48]/60">
            No patients have been assigned care plans yet. Create and assign care plans to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="space-y-3">
            {patients.map((patient) => (
              <div
                key={patient.patient_id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-[#323e48]/10 hover:border-pink-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#323e48] mb-1">
                      {patient.patient_name}
                    </h3>
                    <div className="space-y-1 text-sm text-[#323e48]/70 mb-3">
                      {patient.patient_email && <p>Email: {patient.patient_email}</p>}
                      {patient.patient_phone && <p>Phone: {patient.patient_phone}</p>}
                    </div>
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <p className="font-semibold text-pink-800 text-sm mb-1">
                        {patient.care_plan_name}
                      </p>
                      {patient.care_plan_description && (
                        <p className="text-xs text-pink-700">{patient.care_plan_description}</p>
                      )}
                      <p className="text-xs text-pink-600 mt-2">
                        Updated: {new Date(patient.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleEditPlan(patient)}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Plan
                    </Button>
                    {patient.patient_phone && (
                      <Button
                        onClick={() => openSmsModal(patient)}
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        SMS
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {smsModal.open && smsModal.patient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#323e48]">Send SMS</h2>
                <p className="text-sm text-[#323e48]/60">To: {smsModal.patient.patient_name}</p>
              </div>
            </div>

            {smsModal.patient.patient_phone ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#323e48] mb-2">
                    Phone: {smsModal.patient.patient_phone}
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 bg-white border-2 border-[#323e48]/20 rounded-xl text-[#323e48] resize-none focus:border-green-500 focus:outline-none"
                    rows={4}
                    disabled={sendingSms}
                  />
                  <p className="text-xs text-[#323e48]/60 mt-1">
                    {smsMessage.length} characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSendSms}
                    disabled={sendingSms || !smsMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {sendingSms ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send SMS
                      </>
                    )}
                  </Button>
                  <Button onClick={closeSmsModal} variant="outline" disabled={sendingSms}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#323e48]/60 mb-4">
                  This patient does not have a phone number on file.
                </p>
                <Button onClick={closeSmsModal} variant="outline">
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
