import { useState, useEffect } from "react";
import { Bell, Clock, Sun, Moon, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { NotificationPreferences } from "~backend/notifications/types";
import Tooltip from "@/components/Tooltip";

export default function NotificationsView() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const userId = "user_1";

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await backend.notifications.getPreferences({ user_id: userId });
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const updated = await backend.notifications.updatePreferences({
        user_id: userId,
        morning_checkin_enabled: preferences.morning_checkin_enabled,
        morning_checkin_time: preferences.morning_checkin_time,
        medication_reminders_enabled: preferences.medication_reminders_enabled,
        evening_reflection_enabled: preferences.evening_reflection_enabled,
        evening_reflection_time: preferences.evening_reflection_time,
        notification_method: preferences.notification_method,
        phone_number: preferences.phone_number,
        timezone: preferences.timezone,
      });

      setPreferences(updated);
      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Browser notifications are not supported",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast({
        title: "Success",
        description: "Browser notifications enabled",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#323e48]">Loading...</div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Notifications</h2>
            <p className="text-sm text-[#4e8f71]">Manage your reminders</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Notification Method</h3>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setPreferences({ ...preferences, notification_method: "browser" })}
                variant={preferences.notification_method === "browser" ? "default" : "outline"}
                className={preferences.notification_method === "browser" ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89]" : ""}
              >
                Browser Only
              </Button>
              <Button
                onClick={() => setPreferences({ ...preferences, notification_method: "sms" })}
                variant={preferences.notification_method === "sms" ? "default" : "outline"}
                className={preferences.notification_method === "sms" ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89]" : ""}
              >
                SMS Only
              </Button>
              <Button
                onClick={() => setPreferences({ ...preferences, notification_method: "both" })}
                variant={preferences.notification_method === "both" ? "default" : "outline"}
                className={preferences.notification_method === "both" ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89]" : ""}
              >
                Both
              </Button>
            </div>

            {(preferences.notification_method === "sms" || preferences.notification_method === "both") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#323e48] flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={preferences.phone_number || ""}
                  onChange={(e) => setPreferences({ ...preferences, phone_number: e.target.value })}
                  className="bg-white/80"
                />
                <p className="text-xs text-[#323e48]/60">Include country code (e.g., +1 for US)</p>
              </div>
            )}

            {preferences.notification_method === "browser" || preferences.notification_method === "both" ? (
              <Tooltip content="Allow browser to show notifications" side="top">
                <Button
                  onClick={requestNotificationPermission}
                  variant="outline"
                  className="mt-2"
                >
                  Enable Browser Notifications
                </Button>
              </Tooltip>
            ) : null}
          </div>

          <div>
            <h3 className="font-semibold text-[#323e48] mb-3">Reminder Preferences</h3>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-[#4e8f71]" />
                    <div>
                      <p className="font-medium text-[#323e48]">Morning Check-In</p>
                      <p className="text-xs text-[#323e48]/60">Daily reminder to start your day</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.morning_checkin_enabled}
                      onChange={(e) => setPreferences({ ...preferences, morning_checkin_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4e8f71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#4e8f71] peer-checked:to-[#364d89]"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#323e48]" />
                  <Input
                    type="time"
                    value={preferences.morning_checkin_time}
                    onChange={(e) => setPreferences({ ...preferences, morning_checkin_time: e.target.value })}
                    className="w-32 bg-white/80 text-sm"
                  />
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl p-4 border border-[#364d89]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#364d89]" />
                    <div>
                      <p className="font-medium text-[#323e48]">Medication Reminders</p>
                      <p className="text-xs text-[#323e48]/60">Never miss your medications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.medication_reminders_enabled}
                      onChange={(e) => setPreferences({ ...preferences, medication_reminders_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4e8f71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#4e8f71] peer-checked:to-[#364d89]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#323e48]/60">
                  Times are based on your Doctor's Orders
                </p>
              </div>

              <div className="bg-white/90 rounded-2xl p-4 border border-[#6656cb]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-[#6656cb]" />
                    <div>
                      <p className="font-medium text-[#323e48]">Evening Reflection</p>
                      <p className="text-xs text-[#323e48]/60">Wind down and reflect on your day</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.evening_reflection_enabled}
                      onChange={(e) => setPreferences({ ...preferences, evening_reflection_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4e8f71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#4e8f71] peer-checked:to-[#364d89]"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#323e48]" />
                  <Input
                    type="time"
                    value={preferences.evening_reflection_time}
                    onChange={(e) => setPreferences({ ...preferences, evening_reflection_time: e.target.value })}
                    className="w-32 bg-white/80 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <Tooltip content="Save all notification settings" side="top">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white shadow-xl"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
