import { useState, useEffect } from "react";
import backend from "~backend/client";
import type { UserListResponse, UsageStatsResponse } from "~backend/admin_portal/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { LogOut, Users, Activity, TrendingUp, Book, Calendar, MessageSquare } from "lucide-react";

interface AdminDashboardProps {
  adminToken: string;
  onLogout: () => void;
}

export default function AdminDashboard({ adminToken, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "usage">("users");
  const [users, setUsers] = useState<UserListResponse | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadUsageStats();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await backend.admin_portal.listUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const data = await backend.admin_portal.getUsageStats();
      setUsageStats(data);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await backend.admin_portal.resetPassword({
        userId: resetPasswordUserId,
        newPassword,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        setResetPasswordUserId("");
        setNewPassword("");
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setActiveTab("users")}
            className={activeTab === "users" ? "bg-purple-600" : "bg-white/10 hover:bg-white/20"}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
          <Button
            onClick={() => setActiveTab("usage")}
            className={activeTab === "usage" ? "bg-purple-600" : "bg-white/10 hover:bg-white/20"}
          >
            <Activity className="w-4 h-4 mr-2" />
            Usage Stats
          </Button>
        </div>

        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Reset Password</h2>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    User ID
                  </label>
                  <Input
                    value={resetPasswordUserId}
                    onChange={(e) => setResetPasswordUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Reset Password
                </Button>
              </form>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Users ({users?.total || 0})
                </h2>
                <Button
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Refresh
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-purple-200 font-medium py-3 px-4">ID</th>
                      <th className="text-left text-purple-200 font-medium py-3 px-4">Email</th>
                      <th className="text-left text-purple-200 font-medium py-3 px-4">Created</th>
                      <th className="text-left text-purple-200 font-medium py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white/80 text-sm font-mono">
                          {user.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-white/80">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.is_active 
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "usage" && usageStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="w-8 h-8" />}
                title="Total Users"
                value={usageStats.stats.totalUsers}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Active Users (30d)"
                value={usageStats.stats.activeUsers}
                color="green"
              />
              <StatCard
                icon={<MessageSquare className="w-8 h-8" />}
                title="Conversations"
                value={usageStats.stats.totalConversations}
                color="blue"
              />
              <StatCard
                icon={<Calendar className="w-8 h-8" />}
                title="Morning Routines"
                value={usageStats.stats.totalMorningRoutines}
                color="orange"
              />
              <StatCard
                icon={<Book className="w-8 h-8" />}
                title="Journal Entries"
                value={usageStats.stats.totalJournalEntries}
                color="pink"
              />
              <StatCard
                icon={<Activity className="w-8 h-8" />}
                title="Meal Plans"
                value={usageStats.stats.totalMealPlans}
                color="teal"
              />
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Top Users by Activity</h2>
              <div className="space-y-3">
                {usageStats.topUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400 font-bold w-6">#{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-white/60 text-sm font-mono">{user.userId.substring(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="text-purple-300 font-semibold">
                      {user.conversationCount} conversations
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    purple: "from-purple-600 to-purple-800",
    green: "from-green-600 to-green-800",
    blue: "from-blue-600 to-blue-800",
    orange: "from-orange-600 to-orange-800",
    pink: "from-pink-600 to-pink-800",
    teal: "from-teal-600 to-teal-800",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-6 text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}
