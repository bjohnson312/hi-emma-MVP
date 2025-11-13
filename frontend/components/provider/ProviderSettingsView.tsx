import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Bell, Calendar, Shield, Building } from "lucide-react";

export default function ProviderSettingsView() {
  const [profile, setProfile] = useState({
    fullName: "Dr. Robert Smith",
    email: "dr.smith@hospital.com",
    specialty: "Primary Care",
    licenseNumber: "MD123456",
    phone: "(555) 123-4567",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    riskAlerts: true,
    messageNotifications: true,
    weeklyReports: true,
  });

  const [schedule, setSchedule] = useState({
    availableFrom: "08:00",
    availableTo: "18:00",
    timezone: "EST",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Provider Profile
          </h3>
          <p className="text-sm text-gray-600 mt-1">Update your professional information</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <Input
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <Input
                value={profile.licenseNumber}
                onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Notification Preferences
          </h3>
          <p className="text-sm text-gray-600 mt-1">Choose how you want to be notified</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Alerts</p>
              <p className="text-sm text-gray-600">Receive alerts via email</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailAlerts}
              onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">SMS Alerts</p>
              <p className="text-sm text-gray-600">Receive urgent alerts via text</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.smsAlerts}
              onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Risk Alerts</p>
              <p className="text-sm text-gray-600">Get notified of high-risk patient flags</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.riskAlerts}
              onChange={(e) => setNotifications({ ...notifications, riskAlerts: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Message Notifications</p>
              <p className="text-sm text-gray-600">Notify when patients send messages</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.messageNotifications}
              onChange={(e) => setNotifications({ ...notifications, messageNotifications: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Weekly Reports</p>
              <p className="text-sm text-gray-600">Receive weekly patient summary emails</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyReports}
              onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>

          <Button className="mt-4">Save Preferences</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Schedule & Availability
          </h3>
          <p className="text-sm text-gray-600 mt-1">Set your working hours</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available From</label>
              <Input
                type="time"
                value={schedule.availableFrom}
                onChange={(e) => setSchedule({ ...schedule, availableFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available To</label>
              <Input
                type="time"
                value={schedule.availableTo}
                onChange={(e) => setSchedule({ ...schedule, availableTo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={schedule.timezone}
                onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="EST">Eastern Time (EST)</option>
                <option value="CST">Central Time (CST)</option>
                <option value="MST">Mountain Time (MST)</option>
                <option value="PST">Pacific Time (PST)</option>
              </select>
            </div>
          </div>
          <Button className="mt-4">Save Schedule</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Security & Privacy
          </h3>
          <p className="text-sm text-gray-600 mt-1">Manage your account security</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
            <p className="text-sm text-gray-600 mb-3">Update your password to keep your account secure</p>
            <Button variant="outline" size="sm">Update Password</Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Session Management</h4>
            <p className="text-sm text-gray-600 mb-3">View and manage your active sessions</p>
            <Button variant="outline" size="sm">View Sessions</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Practice Settings (Admin Only)
          </h3>
          <p className="text-sm text-gray-600 mt-1">Configure practice-level settings</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Team Management</h4>
            <p className="text-sm text-gray-600 mb-3">Add or remove team members and manage roles</p>
            <Button variant="outline" size="sm">Manage Team</Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Custom Care Plans</h4>
            <p className="text-sm text-gray-600 mb-3">Create and customize care plan templates</p>
            <Button variant="outline" size="sm">Configure Plans</Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Subscription & Billing</h4>
            <p className="text-sm text-gray-600 mb-3">Manage your practice subscription</p>
            <Button variant="outline" size="sm">View Billing</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
