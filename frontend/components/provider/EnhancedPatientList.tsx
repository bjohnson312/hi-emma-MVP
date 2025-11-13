import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, AlertTriangle, TrendingDown, CheckCircle, Activity } from "lucide-react";

const DEMO_PATIENTS = [
  { 
    id: "1", 
    name: "Sarah Johnson", 
    age: 68, 
    riskLevel: "high", 
    lastCheckIn: "2 hours ago",
    diagnosis: "Type 2 Diabetes",
    tags: ["Missed meds", "High risk"],
    moodTrend: "declining",
    adherence: 65
  },
  { 
    id: "2", 
    name: "Michael Chen", 
    age: 72, 
    riskLevel: "medium", 
    lastCheckIn: "1 day ago",
    diagnosis: "Hypertension",
    tags: ["Poor mood"],
    moodTrend: "stable",
    adherence: 82
  },
  { 
    id: "3", 
    name: "Emily Rodriguez", 
    age: 65, 
    riskLevel: "high", 
    lastCheckIn: "3 hours ago",
    diagnosis: "COPD",
    tags: ["Symptom spike", "High risk"],
    moodTrend: "improving",
    adherence: 71
  },
  { 
    id: "4", 
    name: "Robert Wilson", 
    age: 70, 
    riskLevel: "medium", 
    lastCheckIn: "2 days ago",
    diagnosis: "Arthritis",
    tags: ["Low routine adherence"],
    moodTrend: "stable",
    adherence: 78
  },
  { 
    id: "5", 
    name: "Linda Martinez", 
    age: 66, 
    riskLevel: "low", 
    lastCheckIn: "5 hours ago",
    diagnosis: "Osteoporosis",
    tags: [],
    moodTrend: "improving",
    adherence: 94
  },
  { 
    id: "6", 
    name: "James Thompson", 
    age: 74, 
    riskLevel: "low", 
    lastCheckIn: "1 hour ago",
    diagnosis: "Heart Disease",
    tags: [],
    moodTrend: "stable",
    adherence: 91
  },
];

interface EnhancedPatientListProps {
  onSelectPatient: (patientId: string) => void;
}

export default function EnhancedPatientList({ onSelectPatient }: EnhancedPatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  const filteredPatients = DEMO_PATIENTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = !selectedRisk || p.riskLevel === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "bg-red-100 text-red-800 border-red-300";
      case "medium": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const getMoodIcon = (trend: string) => {
    switch (trend) {
      case "declining": return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "improving": return <Activity className="w-4 h-4 text-green-600" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const togglePatientSelection = (id: string) => {
    setSelectedPatients(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient List</h2>
        <p className="text-gray-600">Manage and monitor all patients under your care</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or diagnosis..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedRisk(null)}
              variant={!selectedRisk ? "default" : "outline"}
              size="sm"
            >
              All
            </Button>
            <Button
              onClick={() => setSelectedRisk("high")}
              variant={selectedRisk === "high" ? "default" : "outline"}
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              High Risk
            </Button>
            <Button
              onClick={() => setSelectedRisk("medium")}
              variant={selectedRisk === "medium" ? "default" : "outline"}
              size="sm"
            >
              Medium
            </Button>
            <Button
              onClick={() => setSelectedRisk("low")}
              variant={selectedRisk === "low" ? "default" : "outline"}
              size="sm"
            >
              Low
            </Button>
          </div>
        </div>

        {selectedPatients.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedPatients.length} patient(s) selected
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Send Reminder
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#6656cb] transition-colors cursor-pointer"
              onClick={() => onSelectPatient(patient.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(patient.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      togglePatientSelection(patient.id);
                    }}
                    className="mt-1 w-4 h-4 rounded border-gray-300"
                  />
                  
                  <div className="w-12 h-12 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold text-lg">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(patient.riskLevel)}`}>
                        {patient.riskLevel} risk
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Age: {patient.age} • {patient.diagnosis}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {getMoodIcon(patient.moodTrend)}
                        <span className="text-gray-600 capitalize">{patient.moodTrend}</span>
                      </div>
                      <div className="text-gray-600">
                        Adherence: <span className={`font-semibold ${
                          patient.adherence >= 90 ? 'text-green-600' :
                          patient.adherence >= 75 ? 'text-blue-600' :
                          'text-red-600'
                        }`}>{patient.adherence}%</span>
                      </div>
                      <div className="text-gray-500">
                        Last check-in: {patient.lastCheckIn}
                      </div>
                    </div>
                    
                    {patient.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {patient.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
