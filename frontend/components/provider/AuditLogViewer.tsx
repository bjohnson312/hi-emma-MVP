import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";
import type { AuditLog } from "~backend/provider_portal/get_audit_logs";
import { Shield, Search, Calendar, User, FileText } from "lucide-react";

interface AuditLogViewerProps {
  token: string;
}

export function AuditLogViewer({ token }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await backend.provider_portal.getAuditLogs({
        token,
      });
      setLogs(data.logs);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error loading audit logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.patientUserId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          HIPAA Audit Logs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          All access and modifications are logged for compliance purposes
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="pl-10"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                log.status === "success"
                  ? "border-gray-200 dark:border-gray-700"
                  : "border-red-300 dark:border-red-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                      {log.status}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      Resource: {log.resourceType} {log.resourceId && `(${log.resourceId})`}
                    </div>
                    {log.patientUserId && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        Patient: {log.patientUserId}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
