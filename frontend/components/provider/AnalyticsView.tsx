import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Download, Users, Activity, Pill, Apple, Filter } from "lucide-react";

const ADHERENCE_DATA = [
  { month: "Jan", meds: 85, routines: 78, meals: 82 },
  { month: "Feb", meds: 88, routines: 81, meals: 85 },
  { month: "Mar", meds: 82, routines: 76, meals: 79 },
  { month: "Apr", meds: 90, routines: 85, meals: 88 },
  { month: "May", meds: 87, routines: 83, meals: 86 },
];

const MOOD_HEATMAP_DATA = [
  { week: "Week 1", avg: 7.2 },
  { week: "Week 2", avg: 6.8 },
  { week: "Week 3", avg: 6.5 },
  { week: "Week 4", avg: 7.5 },
];

const POPULATION_STATS = {
  totalPatients: 24,
  highRisk: 3,
  mediumRisk: 8,
  lowRisk: 13,
  avgAdherence: 85,
  avgMood: 7.1,
};

const RISK_DISTRIBUTION = [
  { level: "High Risk", count: 3, percentage: 12.5, color: "bg-red-500" },
  { level: "Medium Risk", count: 8, percentage: 33.3, color: "bg-orange-500" },
  { level: "Low Risk", count: 13, percentage: 54.2, color: "bg-green-500" },
];

const PATIENT_LIST = [
  { id: "all", name: "All Patients" },
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emily Rodriguez" },
  { id: "4", name: "Robert Wilson" },
  { id: "5", name: "Linda Martinez" },
  { id: "6", name: "James Thompson" },
];

export default function AnalyticsView() {
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("6months");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reporting</h2>
          <p className="text-gray-600">
            {selectedPatient === "all" 
              ? "Comprehensive insights across your patient population"
              : `Analytics for ${PATIENT_LIST.find(p => p.id === selectedPatient)?.name}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            Filter by Patient:
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#6656cb]"
            >
              {PATIENT_LIST.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
          {selectedPatient !== "all" && (
            <Button
              onClick={() => setSelectedPatient("all")}
              variant="outline"
              size="sm"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setTimeRange("1month")}
          variant={timeRange === "1month" ? "default" : "outline"}
          size="sm"
        >
          1 Month
        </Button>
        <Button
          onClick={() => setTimeRange("3months")}
          variant={timeRange === "3months" ? "default" : "outline"}
          size="sm"
        >
          3 Months
        </Button>
        <Button
          onClick={() => setTimeRange("6months")}
          variant={timeRange === "6months" ? "default" : "outline"}
          size="sm"
        >
          6 Months
        </Button>
        <Button
          onClick={() => setTimeRange("1year")}
          variant={timeRange === "1year" ? "default" : "outline"}
          size="sm"
        >
          1 Year
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{POPULATION_STATS.totalPatients}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Adherence</p>
              <p className="text-3xl font-bold text-green-600">{POPULATION_STATS.avgAdherence}%</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Mood Score</p>
              <p className="text-3xl font-bold text-purple-600">{POPULATION_STATS.avgMood}/10</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Risk</p>
              <p className="text-3xl font-bold text-red-600">{POPULATION_STATS.highRisk}</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Adherence Report (Trend)
            </h3>
            <p className="text-sm text-gray-600 mt-1">Medications, routines, and meal tracking</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Medications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Routines</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>Meals</span>
                </div>
              </div>
              
              <div className="h-64 flex items-end gap-4">
                {ADHERENCE_DATA.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full space-y-1">
                      <div className="bg-blue-500 rounded" style={{ height: `${data.meds * 0.8}px` }}></div>
                      <div className="bg-green-500 rounded" style={{ height: `${data.routines * 0.8}px` }}></div>
                      <div className="bg-orange-500 rounded" style={{ height: `${data.meals * 0.8}px` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 text-center">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Mood & Symptom Heatmap
            </h3>
            <p className="text-sm text-gray-600 mt-1">Weekly average mood scores</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {MOOD_HEATMAP_DATA.map((week, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{week.week}</span>
                    <span className="text-gray-600">{week.avg}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div 
                      className={`h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        week.avg >= 7 ? 'bg-green-500' :
                        week.avg >= 5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${week.avg * 10}%` }}
                    >
                      {week.avg >= 3 && week.avg.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Risk Distribution</h3>
          <p className="text-sm text-gray-600 mt-1">Patient population by risk level</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {RISK_DISTRIBUTION.map((risk, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{risk.level}</span>
                  <span className="text-gray-600">{risk.count} patients ({risk.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className={`${risk.color} h-6 rounded-full flex items-center justify-end pr-2 text-white text-sm font-medium`}
                    style={{ width: `${risk.percentage}%` }}
                  >
                    {risk.percentage >= 15 && `${risk.percentage.toFixed(0)}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Weekly Trend Report</h3>
          <p className="text-sm text-gray-600 mt-1">Key metrics summary</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Medication Adherence</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">87%</p>
              <p className="text-sm text-gray-600">↑ 3% from last week</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Routine Completion</h4>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">83%</p>
              <p className="text-sm text-gray-600">↑ 5% from last week</p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Meal Logging</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600 mb-1">86%</p>
              <p className="text-sm text-gray-600">↑ 2% from last week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
