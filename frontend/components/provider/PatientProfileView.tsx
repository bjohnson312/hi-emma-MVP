import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Sunrise, Heart, Stethoscope, Apple, Moon, TrendingUp, TrendingDown, Pill, Activity } from "lucide-react";

const DEMO_PATIENT = {
  id: "1",
  name: "Sarah Johnson",
  age: 68,
  diagnosis: "Type 2 Diabetes, Hypertension",
  riskScore: 7.5,
  careTeam: ["Dr. Smith (Primary)", "Nurse Emma", "Dietitian Jones"],
  alerts: ["Missed medications (2)", "Mood declining", "Low activity"],
};

const MORNING_ROUTINE_DATA = [
  { day: "Mon", completed: true, energy: "high", duration: 25 },
  { day: "Tue", completed: true, energy: "medium", duration: 22 },
  { day: "Wed", completed: false, energy: null, duration: 0 },
  { day: "Thu", completed: true, energy: "low", duration: 18 },
  { day: "Fri", completed: true, energy: "high", duration: 27 },
  { day: "Sat", completed: true, energy: "medium", duration: 23 },
  { day: "Sun", completed: false, energy: null, duration: 0 },
];

const MOOD_DATA = [
  { date: "May 1", mood: 7, symptoms: ["Fatigue"] },
  { date: "May 2", mood: 6, symptoms: ["Headache"] },
  { date: "May 3", mood: 5, symptoms: ["Fatigue", "Dizziness"] },
  { date: "May 4", mood: 4, symptoms: ["Pain"] },
  { date: "May 5", mood: 6, symptoms: [] },
  { date: "May 6", mood: 7, symptoms: [] },
  { date: "May 7", mood: 8, symptoms: [] },
];

const MEDICATIONS = [
  { name: "Metformin", dosage: "500mg", frequency: "2x daily", adherence: 85, lastTaken: "2 hours ago" },
  { name: "Lisinopril", dosage: "10mg", frequency: "1x daily", adherence: 92, lastTaken: "8 hours ago" },
  { name: "Atorvastatin", dosage: "20mg", frequency: "1x evening", adherence: 78, lastTaken: "Yesterday" },
];

const MEAL_LOGS = [
  { meal: "Breakfast", time: "8:00 AM", items: ["Oatmeal", "Berries", "Green tea"], calories: 320 },
  { meal: "Lunch", time: "12:30 PM", items: ["Grilled chicken", "Salad", "Brown rice"], calories: 450 },
  { meal: "Dinner", time: "6:00 PM", items: ["Salmon", "Broccoli", "Quinoa"], calories: 520 },
];

interface PatientProfileViewProps {
  patientId: string;
  onBack: () => void;
}

export default function PatientProfileView({ patientId, onBack }: PatientProfileViewProps) {
  const [activeTab, setActiveTab] = useState<string>("morning");

  const tabs = [
    { id: "morning", label: "Morning Routine", icon: Sunrise },
    { id: "mood", label: "Mood & Symptoms", icon: Heart },
    { id: "doctors", label: "Doctor's Orders", icon: Stethoscope },
    { id: "nutrition", label: "Diet & Nutrition", icon: Apple },
    { id: "evening", label: "Evening Routine", icon: Moon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold text-2xl">
              SJ
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{DEMO_PATIENT.name}</h2>
              <p className="text-gray-600">Age: {DEMO_PATIENT.age} • {DEMO_PATIENT.diagnosis}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Care Team:</span>
                {DEMO_PATIENT.careTeam.map((member, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="mb-2">
              <span className="text-sm text-gray-600">Risk Score</span>
              <div className="text-3xl font-bold text-red-600">{DEMO_PATIENT.riskScore}/10</div>
            </div>
            <div className="flex flex-col gap-1">
              {DEMO_PATIENT.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  {alert}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#6656cb] text-[#6656cb] font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {activeTab === "morning" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 7 Days - Routine Completion</h3>
                <div className="grid grid-cols-7 gap-2">
                  {MORNING_ROUTINE_DATA.map((day, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`w-full h-24 rounded-lg border-2 flex items-center justify-center ${
                        day.completed 
                          ? "border-green-500 bg-green-50" 
                          : "border-gray-300 bg-gray-50"
                      }`}>
                        {day.completed ? (
                          <div className="text-center">
                            <div className="text-2xl">✓</div>
                            <div className="text-xs text-gray-600 mt-1">{day.duration}m</div>
                          </div>
                        ) : (
                          <div className="text-2xl text-gray-400">✗</div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-2">{day.day}</p>
                      {day.energy && (
                        <p className={`text-xs ${
                          day.energy === 'high' ? 'text-green-600' :
                          day.energy === 'medium' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {day.energy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-600">71%</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Avg Duration</p>
                  <p className="text-3xl font-bold text-blue-600">23m</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Energy Trend</p>
                  <p className="text-3xl font-bold text-orange-600">Mixed</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mood" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Tracker (Last 7 Days)</h3>
                <div className="h-64 flex items-end gap-3">
                  {MOOD_DATA.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full bg-gray-200 rounded-t-lg" style={{ height: `${data.mood * 12.5}%` }}>
                        <div className={`absolute inset-0 rounded-t-lg ${
                          data.mood >= 7 ? 'bg-green-500' :
                          data.mood >= 5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-semibold">
                          {data.mood}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 text-center">{data.date.split(' ')[1]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Log</h3>
                <div className="space-y-2">
                  {MOOD_DATA.filter(d => d.symptoms.length > 0).map((data, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{data.date}</span>
                      <div className="flex gap-2">
                        {data.symptoms.map((symptom, sidx) => (
                          <span key={sidx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication Adherence</h3>
                <div className="space-y-4">
                  {MEDICATIONS.map((med, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{med.name}</h4>
                          <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          med.adherence >= 90 ? 'bg-green-100 text-green-800' :
                          med.adherence >= 75 ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {med.adherence}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            med.adherence >= 90 ? 'bg-green-500' :
                            med.adherence >= 75 ? 'bg-blue-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${med.adherence}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Last taken: {med.lastTaken}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Meal Log</h3>
                <div className="space-y-3">
                  {MEAL_LOGS.map((meal, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Apple className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">{meal.meal}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{meal.time}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {meal.items.join(', ')}
                      </p>
                      <p className="text-sm font-medium text-blue-600">{meal.calories} calories</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Calories</p>
                  <p className="text-3xl font-bold text-blue-600">1,290</p>
                  <p className="text-xs text-gray-500 mt-1">Target: 1,800</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Hydration</p>
                  <p className="text-3xl font-bold text-green-600">6 glasses</p>
                  <p className="text-xs text-gray-500 mt-1">Target: 8 glasses</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "evening" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Evening Routine Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Journaling</h4>
                    </div>
                    <p className="text-sm text-gray-600">Last 7 days: 5/7 completed</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Sleep Prep</h4>
                    </div>
                    <p className="text-sm text-gray-600">Avg bedtime: 10:15 PM</p>
                    <p className="text-xs text-gray-500 mt-2">Avg sleep: 7.2 hours</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
