import { useState, useEffect } from "react";
import backend from "@/lib/backend-client";
import type { MemorySummary } from "~backend/conversation/get_memories";
import { Brain, ChevronDown, ChevronRight, RefreshCw, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface UserMemoryViewProps {
  users: User[];
}

const CATEGORY_LABELS: Record<string, string> = {
  health_concerns: "Health Concerns",
  family: "Family",
  activities: "Activities",
  preferences: "Preferences",
  goals: "Goals",
  work: "Work",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  health_concerns: "bg-red-100 text-red-800 border-red-200",
  family: "bg-pink-100 text-pink-800 border-pink-200",
  activities: "bg-green-100 text-green-800 border-green-200",
  preferences: "bg-blue-100 text-blue-800 border-blue-200",
  goals: "bg-purple-100 text-purple-800 border-purple-200",
  work: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function UserMemoryView({ users }: UserMemoryViewProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memories, setMemories] = useState<MemorySummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const loadMemories = async (userId: string) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await backend.conversation.getMemorySummary({ userId });
      setMemories(response.memories);
      setTotalCount(response.totalCount);
      setExpandedCategories(new Set(response.memories.map((m) => m.category)));
    } catch (err: any) {
      console.error("Failed to load memories:", err);
      setError("Failed to load memories for this user.");
      setMemories([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadMemories(selectedUserId);
    } else {
      setMemories([]);
      setTotalCount(0);
    }
  }, [selectedUserId]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredMemories = memories.map((cat) => ({
    ...cat,
    details: cat.details.filter(
      (d) =>
        !search ||
        d.key.toLowerCase().includes(search.toLowerCase()) ||
        d.value.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.details.length > 0);

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-300" />
          User Conversation Memories
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="" className="bg-gray-800">Select a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id} className="bg-gray-800">
                {user.email} — {user.name}
              </option>
            ))}
          </select>

          {selectedUserId && (
            <button
              onClick={() => loadMemories(selectedUserId)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {selectedUserId && (
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-12 text-white/60">Loading memories...</div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-red-200">
              {error}
            </div>
          )}

          {!isLoading && !error && memories.length === 0 && (
            <div className="bg-white/10 rounded-xl border border-white/20 p-12 text-center text-white/50">
              No memories found for {selectedUser?.email}.
            </div>
          )}

          {!isLoading && memories.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-sm">
                  {totalCount} memories across {memories.length} categories for{" "}
                  <span className="text-white font-medium">{selectedUser?.email}</span>
                </p>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search memories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {filteredMemories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.category);
                const colorClass = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other;
                const label = CATEGORY_LABELS[cat.category] || cat.category.replace(/_/g, " ");

                return (
                  <div
                    key={cat.category}
                    className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(cat.category)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white/60" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/60" />
                        )}
                        <span className="text-white font-medium capitalize">{label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {cat.details.length}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-white/5">
                              <th className="text-left px-4 py-2 text-white/50 font-medium">Key</th>
                              <th className="text-left px-4 py-2 text-white/50 font-medium">Value</th>
                              <th className="text-left px-4 py-2 text-white/50 font-medium">Last Mentioned</th>
                              <th className="text-left px-4 py-2 text-white/50 font-medium">Times</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.details.map((detail, i) => (
                              <tr
                                key={detail.key}
                                className={`border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/5"}`}
                              >
                                <td className="px-4 py-2 text-purple-300 font-mono text-xs">
                                  {detail.key}
                                </td>
                                <td className="px-4 py-2 text-white">{detail.value}</td>
                                <td className="px-4 py-2 text-white/50 text-xs">
                                  {new Date(detail.lastMentioned).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-white/50 text-xs">
                                  {detail.mentionCount}x
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {search && filteredMemories.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  No memories match "{search}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
