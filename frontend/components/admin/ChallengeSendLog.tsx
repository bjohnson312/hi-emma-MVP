import { useState, useEffect, useCallback } from "react";
import backend from "~backend/client";
import type { SendLogEntry } from "~backend/challenges/get_send_log";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Send, RotateCcw, Clock, CheckCircle, XCircle, MessageSquare, AlertTriangle } from "lucide-react";

interface Props {
  userNames: Record<string, string>;
}

type Tab = "upcoming" | "sent" | "missed";

function parseDateLocal(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(dateStr: string | Date): string {
  if (dateStr instanceof Date) {
    return dateStr.toISOString().slice(0, 10);
  }
  return dateStr;
}

function formatScheduledDateTime(entry: SendLogEntry): string {
  if (!entry.scheduled_date || !entry.send_time) return "—";
  const iso = toDateString(entry.scheduled_date as string | Date);
  const [year, month, day] = iso.split("-").map(Number);
  const [hour, minute] = entry.send_time.split(":").map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const m = minute.toString().padStart(2, "0");
  const tz = (entry.timezone ?? "").replace("America/", "").replace(/_/g, " ");
  return `${formatted} at ${h}:${m} ${ampm} ${tz}`;
}

function KindBadge({ entry, isPastDue }: { entry: SendLogEntry; isPastDue: boolean }) {
  if (entry.kind === "upcoming") {
    if (isPastDue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Past due
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3" />
        Upcoming
      </span>
    );
  }
  if (entry.kind === "missed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" />
        Failed
      </span>
    );
  }
  if (entry.replied_at) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <MessageSquare className="w-3 h-3" />
        Replied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <CheckCircle className="w-3 h-3" />
      Sent
    </span>
  );
}

export default function ChallengeSendLog({ userNames }: Props) {
  const [entries, setEntries] = useState<SendLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await backend.challenges.getSendLog();
      setEntries(res.entries);
    } catch (err) {
      console.error("Failed to load send log:", err);
      toast({ title: "Error", description: "Failed to load send log", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleForceSend = async (entry: SendLogEntry, overrideSent: boolean) => {
    const key = `${entry.enrollment_id}-${entry.day_number}`;
    setSending(prev => ({ ...prev, [key]: true }));
    try {
      const res = await backend.challenges.forceSend({
        challenge_id: entry.challenge_id,
        enrollment_id: entry.enrollment_id,
        day_number: entry.day_number,
        override_sent: overrideSent,
      });
      if (res.success) {
        toast({
          title: res.was_resend ? `Day ${entry.day_number} resent` : `Day ${entry.day_number} sent`,
          description: (res.message_body?.slice(0, 100) ?? "") + (res.message_body && res.message_body.length > 100 ? "…" : ""),
        });
        await load();
      } else {
        toast({ title: "Send failed", description: res.error, variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Force send failed:", err);
      toast({ title: "Error", description: "Failed to send", variant: "destructive" });
    } finally {
      setSending(prev => ({ ...prev, [key]: false }));
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = entries.filter(e => e.kind === "upcoming");
  const pastDue = upcoming.filter(e => e.scheduled_date && parseDateLocal(e.scheduled_date as string | Date) < today);
  const trulySent = entries.filter(e => e.kind === "sent");
  const failed = entries.filter(e => e.kind === "missed");

  const tabEntries: Record<Tab, SendLogEntry[]> = { upcoming, sent: trulySent, missed: failed };

  const tabLabels: Record<Tab, string> = {
    upcoming: `Upcoming (${upcoming.length})`,
    sent: `Sent (${trulySent.length})`,
    missed: `Failed (${failed.length})`,
  };

  const visibleEntries = tabEntries[tab];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Send Log</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 25 sends · Next 25 upcoming — resend or force-send any entry</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(["upcoming", "sent", "missed"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabels[t]}
            {t === "upcoming" && pastDue.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pastDue.length} past due
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      )}

      {!loading && visibleEntries.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">
          {tab === "upcoming" ? "No upcoming sends." : tab === "sent" ? "No sends recorded yet." : "No failed sends."}
        </div>
      )}

      {!loading && visibleEntries.length > 0 && (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden bg-white">
          {visibleEntries.map(entry => {
            const key = `${entry.enrollment_id}-${entry.day_number}`;
            const isSending = sending[key];
            const isExpanded = expanded[key];
            const userName = userNames[entry.user_id] || entry.phone_number;
            const isPastDue = entry.kind === "upcoming" && !!entry.scheduled_date && parseDateLocal(entry.scheduled_date as string | Date) < today;

            return (
              <div key={key} className={isPastDue ? "bg-amber-50" : ""}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <KindBadge entry={entry} isPastDue={isPastDue} />
                      <span className="text-sm font-medium text-gray-900 truncate">{userName}</span>
                      <span className="text-xs text-gray-400">{entry.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                      <span>{entry.challenge_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-medium text-gray-700">Day {entry.day_number} / {entry.total_days}</span>
                      <span className="text-gray-300">·</span>
                      <span>
                        {entry.kind === "upcoming"
                          ? `Scheduled ${formatScheduledDateTime(entry)}`
                          : entry.sent_at
                            ? `Sent ${new Date(entry.sent_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                            : ""}
                      </span>
                      {entry.reply_body && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-green-600">Replied</span>
                        </>
                      )}
                    </div>
                    {entry.error && (
                      <div className="text-xs text-red-500 mt-0.5">{entry.error}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(entry.message_body || entry.reply_body) && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [key]: !isExpanded }))}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? "Hide" : "View"}
                      </button>
                    )}

                    {entry.kind === "upcoming" && (
                      <button
                        onClick={() => handleForceSend(entry, false)}
                        disabled={isSending}
                        title={`Send Day ${entry.day_number} now`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        {isSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send now
                      </button>
                    )}

                    {(entry.kind === "sent" || entry.kind === "missed") && (
                      <button
                        onClick={() => handleForceSend(entry, true)}
                        disabled={isSending}
                        title={`Resend Day ${entry.day_number}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                          entry.kind === "missed"
                            ? "text-white bg-red-600 hover:bg-red-700"
                            : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {isSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        {entry.kind === "missed" ? "Retry" : "Resend"}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 border-t border-gray-100 bg-gray-50">
                    {entry.message_body && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mt-2 mb-1">Message sent</div>
                        <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">
                          {entry.message_body}
                        </div>
                      </div>
                    )}
                    {entry.reply_body && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Reply{entry.replied_at ? ` · ${new Date(entry.replied_at).toLocaleString()}` : ""}
                        </div>
                        <div className="text-sm text-gray-800 bg-green-50 border border-green-200 rounded-lg p-3 leading-relaxed">
                          {entry.reply_body}
                        </div>
                      </div>
                    )}
                    {entry.external_id && (
                      <div className="text-xs text-gray-400 font-mono">SID: {entry.external_id}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
