import { useState, useEffect } from "react";
import { Heart, Plus, UserCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import CreateCarePlanView from "@/components/care-plan/CreateCarePlanView";
import CarePlanEditor from "@/components/care-plan/CarePlanEditor";
import TodayCareTasks from "@/components/care-plan/TodayCareTasks";
import type { CarePlanWithTasks } from "~backend/care_plans/types";
import type { CarePlanTask } from "~backend/care_plans/types";
import type { PatientListItem } from "~backend/provider_portal/list_patients";

export default function ProviderCarePlansView() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlanWithTasks | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"main" | "create" | "edit">("main");
  const [editTasks, setEditTasks] = useState<CarePlanTask[]>([]);
  const [editPlanName, setEditPlanName] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadCarePlan();
    } else {
      setCarePlan(null);
    }
  }, [selectedPatientId]);

  async function loadPatients() {
    setLoading(true);
    try {
      const token = localStorage.getItem("provider_token") || "";
      const response = await backend.provider_portal.listPatients({ token });
      setPatients(response.patients);
    } catch (error) {
      console.error("Failed to load patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patient list.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadCarePlan() {
    if (!selectedPatientId) return;
    
    setLoading(true);
    try {
      const response = await backend.care_plans.getUserPlan({ 
        user_id: selectedPatientId 
      });
      setCarePlan(response.plan);
    } catch (error) {
      console.error("Failed to load care plan:", error);
      toast({
        title: "Error",
        description: "Failed to load patient's care plan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleStartCreate() {
    setView("create");
  }

  function handleEditPlan(tasks: CarePlanTask[], planName: string) {
    setEditTasks(tasks);
    setEditPlanName(planName);
    setView("edit");
  }

  function handlePlanSaved() {
    setView("main");
    loadCarePlan();
    toast({
      title: "Success",
      description: "Care plan has been created successfully.",
    });
  }

  function handleBack() {
    setView("main");
  }

  const selectedPatient = patients.find(p => p.userId === selectedPatientId);

  if (view === "main") {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#323e48]">Care Plan Management</h1>
              <p className="text-[#323e48]/70">Create and manage patient care plans</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#323e48] mb-2">
              Select Patient
            </label>
            <select
              value={selectedPatientId || ""}
              onChange={(e) => setSelectedPatientId(e.target.value || null)}
              className="w-full md:w-96 px-4 py-3 bg-white border-2 border-[#323e48]/20 rounded-xl text-[#323e48] focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              disabled={loading}
            >
              <option value="">-- Select a patient --</option>
              {patients.map((patient) => (
                <option key={patient.userId} value={patient.userId}>
                  {patient.fullName} ({patient.email || 'No email'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPatientId && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : carePlan ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#323e48] mb-1">
                      {carePlan.name}
                    </h2>
                    {carePlan.description && (
                      <p className="text-[#323e48]/70">{carePlan.description}</p>
                    )}
                    <p className="text-sm text-[#323e48]/60 mt-2">
                      Created: {new Date(carePlan.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      carePlan.is_active 
                        ? "bg-green-100 text-green-700 border-2 border-green-300" 
                        : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                    }`}>
                      {carePlan.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#323e48] mb-4">
                    Care Tasks ({carePlan.tasks.length})
                  </h3>
                  <div className="space-y-3">
                    {carePlan.tasks
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((task, index) => {
                        const typeEmojis = {
                          medication: "💊",
                          activity: "🏃",
                          measurement: "📊",
                          habit: "✨"
                        };

                        return (
                          <div
                            key={task.id || index}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border-2 border-[#323e48]/10"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{typeEmojis[task.type]}</span>
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#323e48]">{task.label}</h4>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#323e48]/70">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.frequency}
                                  </span>
                                  {task.time_of_day && (
                                    <span>• {task.time_of_day}</span>
                                  )}
                                  {task.reminder_enabled && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                      Reminder On
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="border-t-2 border-[#323e48]/10 pt-6">
                  <h3 className="text-lg font-bold text-[#323e48] mb-4">Today's Progress</h3>
                  <TodayCareTasks userId={selectedPatientId} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-[#323e48] mb-2">
                  No Care Plan Yet
                </h3>
                <p className="text-[#323e48]/70 mb-6">
                  {selectedPatient?.fullName} doesn't have a care plan. Create one to get started.
                </p>
                <Button
                  onClick={handleStartCreate}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Care Plan
                </Button>
              </div>
            )}
          </div>
        )}

        {!selectedPatientId && !loading && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-white/40 text-center">
            <div className="w-20 h-20 rounded-full bg-[#323e48]/10 flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-10 h-10 text-[#323e48]/60" />
            </div>
            <h3 className="text-xl font-bold text-[#323e48] mb-2">Select a Patient</h3>
            <p className="text-[#323e48]/70">
              Choose a patient from the dropdown above to view or create their care plan
            </p>
          </div>
        )}
      </div>
    );
  }

  if (view === "create" && selectedPatientId) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/40">
          <div className="flex items-center gap-3">
            <UserCircle className="w-8 h-8 text-[#323e48]/60" />
            <div>
              <p className="text-sm text-[#323e48]/60">Creating care plan for:</p>
              <p className="font-semibold text-[#323e48]">{selectedPatient?.fullName}</p>
            </div>
          </div>
        </div>

        <CreateCarePlanView
          userId={selectedPatientId}
          onBack={handleBack}
          onPlanCreated={handlePlanSaved}
          onEditPlan={handleEditPlan}
        />
      </div>
    );
  }

  if (view === "edit" && selectedPatientId) {
    return (
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/40">
          <div className="flex items-center gap-3">
            <UserCircle className="w-8 h-8 text-[#323e48]/60" />
            <div>
              <p className="text-sm text-[#323e48]/60">Creating care plan for:</p>
              <p className="font-semibold text-[#323e48]">{selectedPatient?.fullName}</p>
            </div>
          </div>
        </div>

        <CarePlanEditor
          userId={selectedPatientId}
          initialTasks={editTasks}
          initialPlanName={editPlanName}
          onBack={handleBack}
          onSaved={handlePlanSaved}
        />
      </div>
    );
  }

  return null;
}
