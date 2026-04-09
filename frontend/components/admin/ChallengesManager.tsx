import { useState, useEffect } from "react";
import { Plus, Trash2, Users, ChevronDown, ChevronRight, Power, X, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Challenge, DayMessage, UserProgress } from "~backend/challenges/types";
import ChallengeProgressGrid from "./ChallengeProgressGrid";

const DEFAULT_7_DAY_MESSAGES: DayMessage[] = [
  { day: 1, message: "Day 1 of your 7-Day Wellness Challenge! 🌟 Emma here. Today, start with one small healthy habit — drink a glass of water before anything else. Reply YES when you've done it!" },
  { day: 2, message: "Day 2! 💪 Yesterday was great — now let's build on it. Take 5 minutes today to move your body (walk, stretch, anything!). Reply when done." },
  { day: 3, message: "Day 3! You're halfway through the first half! 🎯 Today's focus: sleep. Set a bedtime alarm for tonight. Reply YES to commit." },
  { day: 4, message: "Day 4 — you're doing amazing! 🌿 Today, add one vegetable or fruit to your meals. Small choices add up. Reply with what you had!" },
  { day: 5, message: "Day 5! Almost there 🔥 Today: take 3 deep breaths whenever you feel stressed. It's science — it works. Reply YES when you've tried it." },
  { day: 6, message: "Day 6! One more day after this 🌈 Today, write down one thing you're grateful for. It rewires your brain for positivity. Reply with yours!" },
  { day: 7, message: "Day 7 — YOU DID IT! 🎉 Congratulations on completing the 7-Day Wellness Challenge! Emma is proud of you. Reply DONE to claim your achievement!" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
];

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
}

interface ProgressState {
  challenge: Challenge;
  total_days: number;
  enrollments: UserProgress[];
}

export default function ChallengesManager() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    send_time: "09:00",
    timezone: "America/Chicago",
    day_messages: [] as DayMessage[],
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressState>>({});
  const [loadingProgress, setLoadingProgress] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    send_time: "09:00",
    timezone: "America/Chicago",
    day_messages: DEFAULT_7_DAY_MESSAGES.map(d => ({ ...d })),
    selected_user_ids: [] as string[],
  });

  const { toast } = useToast();

  useEffect(() => {
    loadChallenges();
    loadUsers();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await backend.challenges.listChallenges();
      setChallenges(res.challenges);
    } catch (err) {
      console.error("Failed to load challenges:", err);
      toast({ title: "Error", description: "Failed to load challenges", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await backend.admin_portal.listUsers();
      setUsers(res.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone_number: u.phone_number,
      })));
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadProgress = async (challengeId: number) => {
    try {
      setLoadingProgress(prev => ({ ...prev, [challengeId]: true }));
      const res = await backend.challenges.getChallengeProgress({ id: challengeId });
      setProgressMap(prev => ({ ...prev, [challengeId]: res }));
    } catch (err) {
      console.error("Failed to load progress:", err);
      toast({ title: "Error", description: "Failed to load challenge progress", variant: "destructive" });
    } finally {
      setLoadingProgress(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!progressMap[id]) {
      await loadProgress(id);
    }
  };

  const handleCreate = async () => {
    const selectedUsers = users.filter(u =>
      formData.selected_user_ids.includes(u.id) && u.phone_number
    );

    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Challenge name is required", variant: "destructive" });
      return;
    }
    if (selectedUsers.length === 0) {
      toast({ title: "Validation Error", description: "Select at least one user with a phone number", variant: "destructive" });
      return;
    }

    try {
      const res = await backend.challenges.createChallenge({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        day_messages: formData.day_messages.filter(d => d.message.trim()),
        send_time: formData.send_time,
        timezone: formData.timezone,
        enrolled_users: selectedUsers.map(u => ({
          user_id: u.id,
          phone_number: u.phone_number!,
        })),
      });

      if (res.success) {
        toast({ title: "Challenge Created", description: `${res.enrolled_count} user(s) enrolled` });
        setShowCreateForm(false);
        resetForm();
        loadChallenges();
      } else {
        toast({ title: "Error", description: res.error || "Failed to create challenge", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to create challenge:", err);
      toast({ title: "Error", description: "Failed to create challenge", variant: "destructive" });
    }
  };

  const openEditForm = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setEditFormData({
      name: challenge.name,
      description: challenge.description || "",
      send_time: challenge.send_time.slice(0, 5),
      timezone: challenge.timezone,
      day_messages: challenge.day_messages.map(d => ({ ...d })),
    });
  };

  const handleUpdate = async () => {
    if (!editingChallenge) return;
    if (!editFormData.name.trim()) {
      toast({ title: "Validation Error", description: "Challenge name is required", variant: "destructive" });
      return;
    }
    try {
      const res = await backend.challenges.updateChallenge({
        id: editingChallenge.id,
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        send_time: editFormData.send_time,
        timezone: editFormData.timezone,
        day_messages: editFormData.day_messages.filter(d => d.message.trim()),
      });
      if (res.success) {
        toast({ title: "Challenge Updated" });
        setEditingChallenge(null);
        loadChallenges();
      } else {
        toast({ title: "Error", description: res.error || "Failed to update challenge", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to update challenge:", err);
      toast({ title: "Error", description: "Failed to update challenge", variant: "destructive" });
    }
  };

  const updateEditDayMessage = (day: number, message: string) => {
    setEditFormData(prev => ({
      ...prev,
      day_messages: prev.day_messages.map(d => d.day === day ? { ...d, message } : d),
    }));
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await backend.challenges.updateChallenge({ id, is_active: !isActive });
      toast({ title: !isActive ? "Challenge Activated" : "Challenge Paused" });
      loadChallenges();
    } catch (err) {
      console.error("Failed to toggle:", err);
      toast({ title: "Error", description: "Failed to update challenge", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this challenge and all its send history?")) return;
    try {
      await backend.challenges.deleteChallenge({ id });
      toast({ title: "Deleted" });
      setChallenges(prev => prev.filter(c => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Failed to delete:", err);
      toast({ title: "Error", description: "Failed to delete challenge", variant: "destructive" });
    }
  };

  const handleUnenroll = async (challengeId: number, userId: string) => {
    if (!confirm("Unenroll this user from the challenge?")) return;
    try {
      await backend.challenges.unenrollUser({ challenge_id: challengeId, user_id: userId });
      toast({ title: "User unenrolled" });
      await loadProgress(challengeId);
    } catch (err) {
      console.error("Failed to unenroll:", err);
      toast({ title: "Error", description: "Failed to unenroll user", variant: "destructive" });
    }
  };

  const handleRunSends = async () => {
    try {
      const res = await backend.challenges.sendChallengeDaysHandler();
      toast({
        title: "Sends executed",
        description: `Sent: ${res.sent}, Skipped: ${res.skipped}, Errors: ${res.errors}`,
      });
      if (expandedId) await loadProgress(expandedId);
    } catch (err) {
      console.error("Failed to run sends:", err);
      toast({ title: "Error", description: "Failed to run sends", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      send_time: "09:00",
      timezone: "America/Chicago",
      day_messages: DEFAULT_7_DAY_MESSAGES.map(d => ({ ...d })),
      selected_user_ids: [],
    });
  };

  const updateDayMessage = (day: number, message: string) => {
    setFormData(prev => ({
      ...prev,
      day_messages: prev.day_messages.map(d => d.day === day ? { ...d, message } : d),
    }));
  };

  const toggleUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_user_ids: prev.selected_user_ids.includes(userId)
        ? prev.selected_user_ids.filter(id => id !== userId)
        : [...prev.selected_user_ids, userId],
    }));
  };

  const usersWithPhone = users.filter(u => u.phone_number);

  const userNameMap: Record<string, string> = {};
  users.forEach(u => { userNameMap[u.id] = u.name || u.email; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">7-Day Challenges</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sequential daily SMS messages — each user gets Day 1 first, then Day 2, etc.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRunSends} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Sends Now
          </Button>
          <Button onClick={() => setShowCreateForm(s => !s)}>
            <Plus className="w-4 h-4 mr-2" />
            New Challenge
          </Button>
        </div>
      </div>

      {editingChallenge && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Challenge</h3>
                <Button variant="outline" size="sm" onClick={() => setEditingChallenge(null)}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Challenge Name *</label>
                  <Input
                    value={editFormData.name}
                    onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editFormData.description}
                    onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Send Time</label>
                  <Input
                    type="time"
                    value={editFormData.send_time}
                    onChange={e => setEditFormData(prev => ({ ...prev, send_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    value={editFormData.timezone}
                    onChange={e => setEditFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Day Messages</label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {editFormData.day_messages.map(d => (
                    <div key={d.day} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-14 pt-2">
                        <span className="text-sm font-semibold text-gray-600">Day {d.day}</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={d.message}
                          onChange={e => updateEditDayMessage(d.day, e.target.value)}
                          rows={2}
                          className="w-full border rounded-lg p-2 text-sm resize-none"
                        />
                        <div className="text-xs text-gray-400 text-right">{d.message.length} chars</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleUpdate} className="flex-1">Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingChallenge(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create New Challenge</h3>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Challenge Name *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="7-Day Wellness Challenge"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Send Time</label>
              <Input
                type="time"
                value={formData.send_time}
                onChange={e => setFormData(prev => ({ ...prev, send_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full border rounded-lg p-2 bg-white"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Day Messages</label>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {formData.day_messages.map(d => (
                <div key={d.day} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-14 pt-2">
                    <span className="text-sm font-semibold text-gray-600">Day {d.day}</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={d.message}
                      onChange={e => updateDayMessage(d.day, e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg p-2 text-sm resize-none"
                      placeholder={`Message for Day ${d.day}...`}
                    />
                    <div className="text-xs text-gray-400 text-right">{d.message.length} chars</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Enroll Users *
                {usersWithPhone.length < users.length && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({users.length - usersWithPhone.length} user(s) hidden — no phone number)
                  </span>
                )}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selected_user_ids: usersWithPhone.map(u => u.id) }))}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selected_user_ids: [] }))}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {usersWithPhone.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">No users with phone numbers found</div>
              ) : (
                usersWithPhone.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_user_ids.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                      <div className="text-xs text-blue-600 font-mono">{user.phone_number}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formData.selected_user_ids.length} selected
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCreate} className="flex-1">
              Create Challenge & Enroll Users
            </Button>
            <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No challenges yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y">
            {challenges.map(challenge => {
              const isExpanded = expandedId === challenge.id;
              const progress = progressMap[challenge.id];

              return (
                <div key={challenge.id}>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(challenge.id)}
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                            <h3 className="text-base font-semibold">{challenge.name}</h3>
                          </button>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            challenge.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {challenge.is_active ? "Active" : "Paused"}
                          </span>
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-gray-500 mt-1 ml-6">{challenge.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1 ml-6">
                          {challenge.day_messages.length} days · Send at {challenge.send_time.slice(0, 5)} ({challenge.timezone})
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(challenge)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(challenge.id, challenge.is_active)}
                          title={challenge.is_active ? "Pause" : "Activate"}
                        >
                          <Power className={`w-4 h-4 ${challenge.is_active ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(challenge.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t bg-gray-50">
                      <div className="flex items-center justify-between pt-4 mb-4">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Participant Progress
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadProgress(challenge.id)}
                          disabled={loadingProgress[challenge.id]}
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${loadingProgress[challenge.id] ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                      </div>

                      {loadingProgress[challenge.id] && (
                        <div className="text-center text-gray-400 py-4">Loading progress...</div>
                      )}

                      {progress && !loadingProgress[challenge.id] && (
                        <>
                          <ChallengeProgressGrid
                            enrollments={progress.enrollments}
                            totalDays={progress.total_days}
                            userNames={userNameMap}
                          />

                          {progress.enrollments.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="text-sm font-medium text-gray-600 mb-2">Unenroll a User</h5>
                              <div className="flex flex-wrap gap-2">
                                {progress.enrollments
                                  .filter(e => e.is_active)
                                  .map(e => (
                                    <button
                                      key={e.user_id}
                                      onClick={() => handleUnenroll(challenge.id, e.user_id)}
                                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:border-red-300 hover:text-red-600 transition-colors"
                                    >
                                      {userNameMap[e.user_id] || e.phone_number} ×
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
