import { useState, useEffect } from "react";
import { ArrowLeft, User, Calendar, Clock, FileText, CheckSquare, Activity, Sparkles, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import type { GetAppointmentDetailResponse, AppointmentNote, AppointmentAction, PatientTimelineEvent } from "~backend/appointments/types";

type SummaryType = "physician" | "nurse" | "dietitian" | "mental_health" | "physical_therapy";

export default function AppointmentDetailView({ appointmentId, onBack }: { appointmentId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<GetAppointmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryType, setSummaryType] = useState<SummaryType>("physician");
  const [summary, setSummary] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"soap" | "progress" | "general">("soap");
  const [savingNote, setSavingNote] = useState(false);

  const [actionTitle, setActionTitle] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");
  const [creatingAction, setCreatingAction] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);

  useEffect(() => {
    loadAppointmentDetail();
  }, [appointmentId]);

  useEffect(() => {
    if (detail) {
      generateSummary();
    }
  }, [summaryType, detail]);

  const loadAppointmentDetail = async () => {
    setLoading(true);
    try {
      let providerId = "demo-provider";
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const result = await backend.appointments.getAppointmentDetail({ 
        appointment_id: parseInt(appointmentId),
        provider_id: providerId
      });
      setDetail(result);
    } catch (error) {
      console.error("Failed to load appointment detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!detail) return;
    
    setGeneratingSummary(true);
    try {
      let providerId = "demo-provider";
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const result = await backend.appointments.generateSummary({
        appointment_id: parseInt(appointmentId),
        summary_type: summaryType,
        provider_id: providerId,
      });
      setSummary(result.key_insights.join("\n• "));
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const saveNote = async () => {
    if (!noteContent.trim() || !detail) return;

    setSavingNote(true);
    try {
      let providerId = "demo-provider";
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      await backend.appointments.createNote({
        appointment_id: parseInt(appointmentId),
        provider_id: providerId,
        note_type: noteType,
        quick_note: noteContent,
      });

      setNoteContent("");
      await loadAppointmentDetail();
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  const createAction = async () => {
    if (!actionTitle.trim() || !detail) return;

    setCreatingAction(true);
    try {
      let providerId = "demo-provider";
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      await backend.appointments.createAction({
        appointment_id: parseInt(appointmentId),
        action_type: "follow_up",
        description: actionTitle,
        due_date: actionDueDate ? new Date(actionDueDate) : undefined,
        assigned_to: providerId,
      });

      setActionTitle("");
      setActionDueDate("");
      setShowActionForm(false);
      await loadAppointmentDetail();
    } catch (error) {
      console.error("Failed to create action:", error);
    } finally {
      setCreatingAction(false);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSoapTemplate = () => {
    return `SUBJECTIVE:
- Chief Complaint:
- History of Present Illness:
- Review of Systems:

OBJECTIVE:
- Vital Signs:
- Physical Exam:
- Lab Results:

ASSESSMENT:
- Diagnosis:
- Clinical Impression:

PLAN:
- Treatment:
- Follow-up:
- Patient Education:`;
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4e8f71]"></div>
          <p className="text-gray-600 mt-4">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center py-12">
          <p className="text-gray-600">Appointment not found.</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{detail.appointment.patient_name}</h1>
            <p className="text-gray-600">
              {new Date(detail.appointment.appointment_date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(detail.appointment.appointment_date).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-[#4e8f71]" />
              <h2 className="text-xl font-bold text-gray-900">Patient Profile</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="text-lg font-semibold text-gray-900">{detail.appointment.patient_age || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Care Team Role</p>
                <p className="text-lg font-semibold text-gray-900">{detail.appointment.care_team_role || "General"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <p className={`text-lg font-semibold capitalize px-3 py-1 rounded-full inline-block ${getRiskColor(detail.appointment.risk_level)}`}>
                  {detail.appointment.risk_level || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{detail.appointment.status}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#4e8f71]" />
                <h2 className="text-xl font-bold text-gray-900">AI-Generated Summary</h2>
              </div>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4e8f71]"
              >
                <option value="physician">Physician Summary</option>
                <option value="nurse">Nurse Summary</option>
                <option value="dietitian">Dietitian Summary</option>
                <option value="mental_health">Mental Health Summary</option>
                <option value="physical_therapy">Physical Therapy Summary</option>
              </select>
            </div>

            {generatingSummary ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#4e8f71]"></div>
                <p className="text-gray-600 mt-3">Generating summary...</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 whitespace-pre-wrap text-gray-800">
                  • {summary}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#4e8f71]" />
              <h2 className="text-xl font-bold text-gray-900">Clinical Notes</h2>
            </div>

            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as "soap" | "progress" | "general")}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                >
                  <option value="soap">SOAP Note</option>
                  <option value="progress">Progress Note</option>
                  <option value="general">General Note</option>
                </select>
                {noteType === "soap" && (
                  <Button
                    onClick={() => setNoteContent(getSoapTemplate())}
                    className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Use Template
                  </Button>
                )}
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter clinical notes..."
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4e8f71] resize-none"
              />
              <Button
                onClick={saveNote}
                disabled={savingNote || !noteContent.trim()}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {detail.notes.map((note: AppointmentNote) => (
                <div key={note.id} className="border-l-4 border-[#4e8f71] bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 uppercase">{note.note_type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {note.quick_note || [note.subjective, note.objective, note.assessment, note.plan].filter(Boolean).join("\n\n")}
                  </p>
                </div>
              ))}
              {detail.notes.length === 0 && (
                <p className="text-gray-500 text-sm italic">No notes yet. Add your first note above.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-6 h-6 text-[#4e8f71]" />
                <h2 className="text-xl font-bold text-gray-900">Actions & Follow-ups</h2>
              </div>
              <Button
                onClick={() => setShowActionForm(!showActionForm)}
                className="px-3 py-2 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showActionForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Action title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#4e8f71]"
                />
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#4e8f71]"
                />
                <Button
                  onClick={createAction}
                  disabled={creatingAction || !actionTitle.trim()}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {creatingAction ? "Creating..." : "Create Action"}
                </Button>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detail.actions.map((action: AppointmentAction) => (
                <div
                  key={action.id}
                  className={`rounded-lg p-4 ${action.status === "completed" ? "bg-green-50" : "bg-yellow-50"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{action.description}</p>
                      {action.due_date && (
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {new Date(action.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                        action.status === "completed" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {action.status}
                    </span>
                  </div>
                </div>
              ))}
              {detail.actions.length === 0 && (
                <p className="text-gray-500 text-sm italic">No actions yet. Create your first action above.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-[#4e8f71]" />
            <h2 className="text-xl font-bold text-gray-900">Patient Timeline</h2>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {detail.timeline_events.map((event: PatientTimelineEvent, index: number) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#4e8f71]"></div>
                  {index < detail.timeline_events.length - 1 && <div className="w-0.5 flex-1 bg-gray-300 mt-1"></div>}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{event.event_type}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{event.source || "Event"}</p>
                  {event.event_data && (
                    <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.event_data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
            {detail.timeline_events.length === 0 && (
              <p className="text-gray-500 text-sm italic">No timeline events available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
