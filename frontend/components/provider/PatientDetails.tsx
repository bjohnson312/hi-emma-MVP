import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { PatientWellnessData } from "~backend/provider_portal/types";
import type { ProviderNote, Message } from "~backend/provider_portal/types";
import { ArrowLeft, FileText, MessageSquare, Activity, TrendingUp } from "lucide-react";

interface PatientDetailsProps {
  token: string;
  patientId: string;
  onBack: () => void;
}

export function PatientDetails({ token, patientId, onBack }: PatientDetailsProps) {
  const [activeTab, setActiveTab] = useState<"data" | "notes" | "messages">("data");
  const [patientData, setPatientData] = useState<PatientWellnessData | null>(null);
  const [notes, setNotes] = useState<ProviderNote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteSubject, setNewNoteSubject] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, notesData, messagesData] = await Promise.all([
        backend.provider_portal.getPatientData({
          patientUserId: patientId,
          token,
        }),
        backend.provider_portal.getNotes({
          patientUserId: patientId,
          token,
        }),
        backend.provider_portal.getMessages({
          patientUserId: patientId,
          token,
        }),
      ]);
      setPatientData(data);
      setNotes(notesData.notes);
      setMessages(messagesData.messages);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading patient data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteSubject || !newNoteContent) return;

    try {
      await backend.provider_portal.addNote({
        patientUserId: patientId,
        noteType: "general",
        subject: newNoteSubject,
        content: newNoteContent,
        token,
      });

      toast({
        title: "Note added",
        description: "Your note has been saved successfully",
      });

      setNewNoteSubject("");
      setNewNoteContent("");
      loadData();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage) return;

    try {
      await backend.provider_portal.sendMessage({
        patientUserId: patientId,
        message: newMessage,
        token,
      });

      toast({
        title: "Message sent",
        description: "Your message has been sent to the patient",
      });

      setNewMessage("");
      loadData();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading patient data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button onClick={onBack} variant="outline" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Patients
      </Button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {patientData?.patientName}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Patient ID: {patientId}</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("data")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "data"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Wellness Data
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "notes"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "messages"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Messages ({messages.length})
        </button>
      </div>

      {activeTab === "data" && patientData && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Morning Check-ins ({patientData.morningCheckIns.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patientData.morningCheckIns.slice(0, 10).map((checkIn: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  {new Date(checkIn.check_in_time).toLocaleString()} - Sleep: {checkIn.sleep_quality || "N/A"}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mood Tracking ({patientData.moodEntries.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patientData.moodEntries.slice(0, 10).map((mood: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  {new Date(mood.tracked_at).toLocaleString()} - {mood.mood_level || "N/A"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Note
            </h3>
            <div className="space-y-4">
              <Input
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
                placeholder="Note subject"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Note content"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Button onClick={handleAddNote}>Add Note</Button>
            </div>
          </div>

          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {note.subject}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {note.content}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  By: {note.providerName} • Priority: {note.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.senderType === "provider"
                      ? "bg-blue-100 dark:bg-blue-900 ml-12"
                      : "bg-gray-100 dark:bg-gray-700 mr-12"
                  }`}
                >
                  <p className="text-sm text-gray-900 dark:text-white">{msg.message}</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {msg.senderType === "provider" ? msg.providerName : "Patient"} •{" "}
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
