import { useState, useEffect } from "react";
import { FileText, Calendar, Shield, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import type { AccessShareResponse } from "~backend/journal/types";

interface SharedReportViewProps {
  shareToken: string;
}

export default function SharedReportView({ shareToken }: SharedReportViewProps) {
  const [data, setData] = useState<AccessShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShareData();
  }, [shareToken]);

  async function loadShareData() {
    setLoading(true);
    setError(null);
    try {
      const result = await backend.journal.accessShare({ share_token: shareToken });
      
      if (!result.valid) {
        setError("This share link is invalid, expired, or has reached its access limit.");
        setLoading(false);
        return;
      }

      setData(result);
    } catch (err) {
      console.error("Failed to load share:", err);
      setError("Failed to load shared data. Please check the link and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!data || !data.pdf_data) return;

    const htmlContent = atob(data.pdf_data);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wellness-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleViewInBrowser() {
    if (!data || !data.pdf_data) return;

    const htmlContent = atob(data.pdf_data);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1ed] via-[#e8f4f0] to-[#e6ecf5] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#4e8f71] animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-[#323e48] mb-2">Loading Shared Report</h2>
            <p className="text-[#323e48]/60">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1ed] via-[#e8f4f0] to-[#e6ecf5] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-[#323e48] mb-2">Access Denied</h2>
            <p className="text-[#323e48]/60">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.format === "pdf") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f1ed] via-[#e8f4f0] to-[#e6ecf5] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Wellness Report</h2>
              {data.recipient_name && (
                <p className="text-sm text-[#4e8f71]">For: {data.recipient_name}</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#4e8f71]" />
                  <span className="text-sm font-medium text-[#323e48]">Privacy Information</span>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  Access Count: {data.access_count}/{data.max_access_count}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#364d89]" />
                  <span className="text-sm font-medium text-[#323e48]">Expiration</span>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  {data.expires_at ? new Date(data.expires_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleViewInBrowser}
              className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Report
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="w-full border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-xs text-yellow-800">
              <strong>Confidential Health Information:</strong> This report contains sensitive health data. 
              Please handle with appropriate privacy and security measures.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1ed] via-[#e8f4f0] to-[#e6ecf5] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#4e8f71]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#323e48]">Wellness Journal Export</h2>
              {data.recipient_name && (
                <p className="text-sm text-[#4e8f71]">For: {data.recipient_name}</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#4e8f71]" />
                  <span className="text-sm font-medium text-[#323e48]">Date Range</span>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  {data.data?.date_range.start ? new Date(data.data.date_range.start).toLocaleDateString() : "N/A"} - 
                  {data.data?.date_range.end ? new Date(data.data.date_range.end).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#364d89]" />
                  <span className="text-sm font-medium text-[#323e48]">Access</span>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  {data.access_count}/{data.max_access_count} views
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#8b5cf6]" />
                  <span className="text-sm font-medium text-[#323e48]">Expires</span>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  {data.expires_at ? new Date(data.expires_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {data.data && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/40">
            <h3 className="font-semibold text-[#323e48] mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <p className="text-sm text-[#323e48]/60">Total Entries</p>
                <p className="text-2xl font-bold text-[#4e8f71]">{data.data.summary.total_entries}</p>
              </div>
              {Object.entries(data.data.summary.categories).map(([category, count]) => (
                <div key={category} className="bg-white/90 border border-[#323e48]/10 rounded-2xl p-4">
                  <p className="text-sm text-[#323e48]/60">{category}</p>
                  <p className="text-2xl font-bold text-[#364d89]">{count as number}</p>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-[#323e48] mb-4">Entries</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.data.entries.map((entry, idx) => (
                <div key={idx} className="bg-white/90 border border-[#323e48]/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#4e8f71]">{entry.category}</span>
                    <span className="text-xs text-[#323e48]/60">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(entry.content).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-[#323e48]/60">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-[#323e48]">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <p className="text-xs text-yellow-800">
            <strong>Confidential Health Information:</strong> This report contains sensitive health data. 
            Please handle with appropriate privacy and security measures.
          </p>
        </div>
      </div>
    </div>
  );
}
