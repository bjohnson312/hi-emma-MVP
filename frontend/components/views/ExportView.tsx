import { useState, useEffect } from "react";
import { Download, Share2, FileText, Calendar, CheckSquare, Clock, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import backend from "~backend/client";
import type { DataCategory, ShareInfo } from "~backend/journal/types";
import { useToast } from "@/components/ui/use-toast";

export default function ExportView() {
  const { toast } = useToast();
  const [userId] = useState("user_123");
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>([
    "morning_routine",
    "evening_routine",
    "mood",
    "nutrition",
    "medication"
  ]);
  const [includeConversations, setIncludeConversations] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(168);
  const [maxAccessCount, setMaxAccessCount] = useState(10);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShares();
  }, []);

  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  async function loadShares() {
    try {
      const result = await backend.journal.listShares({ user_id: userId });
      setShares(result.shares);
    } catch (error) {
      console.error("Failed to load shares:", error);
    }
  }

  function toggleCategory(category: DataCategory) {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }

  async function handleDownloadJSON() {
    setLoading(true);
    try {
      const result = await backend.journal.generateExport({
        user_id: userId,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        categories: selectedCategories,
        include_conversations: includeConversations
      });

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wellness-export-${startDate}-to-${endDate}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Downloaded",
        description: "Your wellness data has been exported to JSON.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate export. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    setLoading(true);
    try {
      const result = await backend.journal.generatePDF({
        user_id: userId,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        categories: selectedCategories,
        include_conversations: includeConversations,
        recipient_name: recipientName || undefined
      });

      const htmlContent = atob(result.pdf_base64);
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your wellness report has been generated.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Report Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateShare(format: "json" | "pdf") {
    if (selectedCategories.length === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one data category to share.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await backend.journal.createShare({
        user_id: userId,
        recipient_name: recipientName || undefined,
        recipient_email: recipientEmail || undefined,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        categories: selectedCategories,
        include_conversations: includeConversations,
        format,
        expires_in_hours: expiresInHours,
        max_access_count: maxAccessCount
      });

      await navigator.clipboard.writeText(result.share_url);

      toast({
        title: "Share Link Created",
        description: "The shareable link has been copied to your clipboard.",
      });

      await loadShares();
    } catch (error) {
      console.error("Share creation failed:", error);
      toast({
        title: "Share Failed",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeShare(shareId: number) {
    try {
      await backend.journal.revokeShare({
        user_id: userId,
        share_id: shareId
      });

      toast({
        title: "Share Revoked",
        description: "The share link has been deactivated.",
      });

      await loadShares();
    } catch (error) {
      console.error("Revoke failed:", error);
      toast({
        title: "Revoke Failed",
        description: "Failed to revoke share. Please try again.",
        variant: "destructive"
      });
    }
  }

  async function copyShareLink(shareId: number) {
    const shareUrl = `https://hi-emma-morning-routine-d44g7ks82vjgsfshe5i0.lp.dev/shared/${shareId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard.",
    });
  }

  const categoryOptions: { value: DataCategory; label: string }[] = [
    { value: "morning_routine", label: "Morning Routine" },
    { value: "evening_routine", label: "Evening Routine" },
    { value: "mood", label: "Mood Tracking" },
    { value: "nutrition", label: "Diet & Nutrition" },
    { value: "medication", label: "Medication Adherence" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Download className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Export & Share</h2>
            <p className="text-sm text-[#4e8f71]">Share your wellness data with healthcare providers</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/90 border-white/40"
                />
              </div>
              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border-white/40"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Data Categories</h3>
            <div className="space-y-2">
              {categoryOptions.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedCategories.includes(value)
                      ? "bg-gradient-to-r from-[#4e8f71]/20 to-[#364d89]/20 border-2 border-[#4e8f71]"
                      : "bg-white/90 border border-[#323e48]/10 hover:border-[#4e8f71]/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(value)}
                    onChange={() => toggleCategory(value)}
                    className="w-5 h-5 rounded border-[#4e8f71] text-[#4e8f71] focus:ring-[#4e8f71]"
                  />
                  <CheckSquare className={`w-5 h-5 ${selectedCategories.includes(value) ? "text-[#4e8f71]" : "text-[#323e48]/40"}`} />
                  <span className="text-[#323e48] font-medium flex-1">{label}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  includeConversations
                    ? "bg-gradient-to-r from-[#8b5cf6]/20 to-[#ec4899]/20 border-2 border-[#8b5cf6]"
                    : "bg-white/90 border border-[#323e48]/10 hover:border-[#8b5cf6]/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeConversations}
                  onChange={(e) => setIncludeConversations(e.target.checked)}
                  className="w-5 h-5 rounded border-[#8b5cf6] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                />
                <FileText className={`w-5 h-5 ${includeConversations ? "text-[#8b5cf6]" : "text-[#323e48]/40"}`} />
                <span className="text-[#323e48] font-medium flex-1">Include Conversations</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Recipient Information (Optional)</h3>
            <div className="space-y-3">
              <div className="bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
                <label className="text-sm font-medium text-[#323e48] mb-2 block">
                  Recipient Name
                </label>
                <Input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Dr. Smith"
                  className="bg-white border-white/40"
                />
              </div>
              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                <label className="text-sm font-medium text-[#323e48] mb-2 block">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="bg-white border-white/40"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Privacy & Security Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-[#323e48] mb-2">
                  <Clock className="w-4 h-4" />
                  Expires In (hours)
                </label>
                <Input
                  type="number"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  min="1"
                  max="720"
                  className="bg-white/90 border-white/40"
                />
              </div>
              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                <label className="text-sm font-medium text-[#323e48] mb-2 block">
                  Max Access Count
                </label>
                <Input
                  type="number"
                  value={maxAccessCount}
                  onChange={(e) => setMaxAccessCount(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="bg-white border-white/40"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadJSON}
              disabled={loading || selectedCategories.length === 0}
              className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={loading || selectedCategories.length === 0}
              className="bg-gradient-to-r from-[#364d89] to-[#8b5cf6] hover:from-[#2a3d6f] hover:to-[#7c3aed] text-white shadow-xl"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleCreateShare("json")}
              disabled={loading || selectedCategories.length === 0}
              variant="outline"
              className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Create JSON Share Link
            </Button>
            <Button
              onClick={() => handleCreateShare("pdf")}
              disabled={loading || selectedCategories.length === 0}
              variant="outline"
              className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Create Report Share Link
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <h3 className="font-semibold text-[#323e48] mb-4">Active Share Links</h3>
        <div className="space-y-3">
          {shares.length === 0 ? (
            <p className="text-[#323e48]/60 text-center py-8">No active share links</p>
          ) : (
            shares.map((share) => (
              <div
                key={share.id}
                className={`p-4 rounded-2xl border ${
                  share.active
                    ? "bg-white/90 border-[#4e8f71]/20"
                    : "bg-[#323e48]/5 border-[#323e48]/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {share.format === "pdf" ? (
                        <FileText className="w-5 h-5 text-[#8b5cf6]" />
                      ) : (
                        <Download className="w-5 h-5 text-[#4e8f71]" />
                      )}
                      <span className="font-medium text-[#323e48]">
                        {share.recipient_name || "Unnamed Share"}
                      </span>
                      {!share.active && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#323e48]/60">
                      {share.categories.join(", ")} • {share.format.toUpperCase()}
                    </p>
                    <p className="text-xs text-[#323e48]/60 mt-1">
                      Created: {new Date(share.created_at).toLocaleDateString()} •
                      Expires: {new Date(share.expires_at).toLocaleDateString()} •
                      Access: {share.access_count}/{share.max_access_count}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {share.active && (
                      <Button
                        onClick={() => copyShareLink(share.id)}
                        size="sm"
                        variant="outline"
                        className="border-[#4e8f71] text-[#4e8f71] hover:bg-[#4e8f71]/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {share.active && (
                      <Button
                        onClick={() => handleRevokeShare(share.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
