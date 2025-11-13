import { AlertTriangle, TrendingDown, Pill, Activity, CheckCircle, Clock, Calendar, Users } from "lucide-react";

const DEMO_RISK_FLAGS = [
  { id: 1, patient: "Sarah Johnson", issue: "Missed medications", severity: "high", time: "2 hours ago", icon: Pill },
  { id: 2, patient: "Michael Chen", issue: "Declining mood trends", severity: "medium", time: "1 day ago", icon: TrendingDown },
  { id: 3, patient: "Emily Rodriguez", issue: "Symptom escalation", severity: "high", time: "3 hours ago", icon: AlertTriangle },
  { id: 4, patient: "Robert Wilson", issue: "Drop-off in routines", severity: "medium", time: "2 days ago", icon: Activity },
];

const DEMO_TASKS = [
  { id: 1, task: "Review notes for Sarah Johnson", type: "notes", priority: "high" },
  { id: 2, task: "Patient message from Michael Chen", type: "message", priority: "medium" },
  { id: 3, task: "Appointment with Emily Rodriguez", type: "appointment", priority: "high" },
  { id: 4, task: "Follow-up alert for Robert Wilson", type: "alert", priority: "medium" },
];

const DEMO_RECENT_ACTIVITY = [
  { id: 1, patient: "Sarah Johnson", activity: "Morning routine completed", time: "30 mins ago" },
  { id: 2, patient: "Michael Chen", activity: "Mood check-in: Feeling anxious", time: "1 hour ago" },
  { id: 3, patient: "Emily Rodriguez", activity: "Medication logged", time: "2 hours ago" },
  { id: 4, patient: "Robert Wilson", activity: "Meal logged: Breakfast", time: "3 hours ago" },
];

const STATS = [
  { label: "Total Patients", value: "24", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "High Risk", value: "3", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  { label: "Tasks Today", value: "8", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
  { label: "Appointments", value: "5", icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
];

export default function HomeDashboard() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "border-red-500 bg-red-50";
      case "medium": return "border-orange-500 bg-orange-50";
      default: return "border-yellow-500 bg-yellow-50";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Welcome back! Here's your patient care overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Patient Risk Flags
            </h3>
            <p className="text-sm text-gray-600 mt-1">Critical alerts requiring immediate attention</p>
          </div>
          <div className="p-6 space-y-4">
            {DEMO_RISK_FLAGS.map((flag) => {
              const Icon = flag.icon;
              return (
                <div 
                  key={flag.id} 
                  className={`border-l-4 p-4 rounded ${getSeverityColor(flag.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${flag.severity === 'high' ? 'text-red-600' : 'text-orange-600'}`} />
                      <div>
                        <p className="font-semibold text-gray-900">{flag.patient}</p>
                        <p className="text-sm text-gray-700 mt-1">{flag.issue}</p>
                        <p className="text-xs text-gray-500 mt-2">{flag.time}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      flag.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Today's Tasks
            </h3>
            <p className="text-sm text-gray-600 mt-1">Action items and follow-ups</p>
          </div>
          <div className="p-6 space-y-3">
            {DEMO_TASKS.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.task}</p>
                    <p className="text-xs text-gray-600 capitalize">{task.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Patient Activity
          </h3>
          <p className="text-sm text-gray-600 mt-1">Latest check-ins and logs</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {DEMO_RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-semibold">
                    {activity.patient.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.patient}</p>
                    <p className="text-sm text-gray-600">{activity.activity}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Care Team Overview
          </h3>
          <p className="text-sm text-gray-600 mt-1">Connected patients and team members</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-3xl font-bold text-purple-600">24</p>
              <p className="text-sm text-gray-600 mt-1">Connected Patients</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">6</p>
              <p className="text-sm text-gray-600 mt-1">Assigned Providers</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-3xl font-bold text-green-600">3</p>
              <p className="text-sm text-gray-600 mt-1">Clinical Support Staff</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
