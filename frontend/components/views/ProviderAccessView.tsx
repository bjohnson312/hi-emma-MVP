import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { ProviderAccessItem } from "~backend/patient_sharing/list_provider_access";
import type { ProviderNoteForPatient } from "~backend/patient_sharing/get_provider_notes";
import { UserPlus, Shield, Calendar, FileText, AlertCircle, CheckCircle } from "lucide-react";

export interface ProviderAccessViewProps {
  userId: string;
}

export function ProviderAccessView({ userId }: ProviderAccessViewProps) {
  const [providers, setProviders] = useState<ProviderAccessItem[]>([]);
  const [notes, setNotes] = useState<ProviderNoteForPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [providerEmail, setProviderEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"read" | "write" | "full">("read");
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providersData, notesData] = await Promise.all([
        backend.patient_sharing.listProviderAccess({ userId }),
        backend.patient_sharing.getProviderNotes({ userId }),
      ]);
      setProviders(providersData.providers);
      setNotes(notesData.notes);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!providerEmail) return;

    try {
      const result = await backend.patient_sharing.grantProviderAccess({
        userId,
        providerEmail,
        accessLevel,
        expiresInDays,
      });

      toast({
        title: "Access granted",
        description: result.message,
      });

      setProviderEmail("");
      setShowGrantForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error granting access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (providerId: string) => {
    if (!confirm("Are you sure you want to revoke access for this provider?")) {
      return;
    }

    try {
      await backend.patient_sharing.revokeProviderAccess({ userId, providerId });

      toast({
        title: "Access revoked",
        description: "Provider access has been revoked successfully",
      });

      loadData();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error revoking access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Healthcare Provider Access
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage which healthcare providers can access your wellness data
          </p>
        </div>
        <Button onClick={() => setShowGrantForm(!showGrantForm)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      {showGrantForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Grant Provider Access
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider Email
              </label>
              <Input
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="doctor@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="read">Read Only</option>
                <option value="write">Read & Write</option>
                <option value="full">Full Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Expires In (Days)
              </label>
              <Input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                min={1}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleGrantAccess}>Grant Access</Button>
              <Button onClick={() => setShowGrantForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Providers ({providers.filter((p) => p.isActive).length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {providers.length === 0 ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              No providers have access to your data
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider.providerId} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {provider.providerName}
                      </h4>
                      {provider.credentials && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {provider.credentials}
                        </span>
                      )}
                      {provider.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {provider.providerEmail}
                    </p>
                    {provider.specialty && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Specialty: {provider.specialty}
                      </p>
                    )}
                    {provider.organization && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Organization: {provider.organization}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        provider.accessLevel === "full"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : provider.accessLevel === "write"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}>
                        {provider.accessLevel}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        Granted: {new Date(provider.grantedAt).toLocaleDateString()}
                      </div>
                      {provider.expiresAt && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          Expires: {new Date(provider.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {provider.isActive && (
                    <Button
                      onClick={() => handleRevokeAccess(provider.providerId)}
                      variant="outline"
                      size="sm"
                    >
                      Revoke Access
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Provider Notes & Recommendations ({notes.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              No notes from providers yet
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {note.subject}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {note.providerName}
                      {note.providerCredentials && `, ${note.providerCredentials}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      note.priority === "urgent"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : note.priority === "high"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}>
                      {note.priority}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {note.content}
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded">
                  {note.noteType}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
