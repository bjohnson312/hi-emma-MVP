import { useState, useEffect } from "react";
import { Calendar, Clock, User, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import backend from "@/lib/backend-client";
import type { AppointmentWithPatient } from "~backend/appointments/types";

type ViewType = "day" | "week" | "month";
type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";

export default function VisitsView({ onSelectAppointment }: { onSelectAppointment: (appointmentId: string) => void }) {
  const [viewType, setViewType] = useState<ViewType>("day");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultDate = new Date("2025-11-14");
  const [currentDate, setCurrentDate] = useState(defaultDate);

  useEffect(() => {
    loadAppointments();
  }, [viewType, statusFilter, currentDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let providerId = "demo-provider";
      try {
        const providerDataStr = localStorage.getItem("provider_data");
        if (providerDataStr) {
          const providerData = JSON.parse(providerDataStr);
          providerId = providerData.id || providerData.email || "demo-provider";
        }
      } catch (e) {
        console.log("Using default provider ID");
      }

      const startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      if (viewType === "day") {
        endDate.setDate(endDate.getDate() + 1);
      } else if (viewType === "week") {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const result = await backend.appointments.getAppointments({
        provider_id: providerId,
        start_date: startDate,
        end_date: endDate,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setAppointments(result.appointments);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const today = new Date(currentDate);
    if (viewType === "day") {
      return today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } else if (viewType === "week") {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 6);
      return `${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage your patient visits and schedule</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
              <Button
                onClick={() => setViewType("day")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewType === "day"
                    ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Day
              </Button>
              <Button
                onClick={() => setViewType("week")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewType === "week"
                    ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Week
              </Button>
              <Button
                onClick={() => setViewType("month")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewType === "month"
                    ? "bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Month
              </Button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4e8f71]"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <Button
            onClick={() => navigateDate("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#4e8f71]" />
            <span className="text-lg font-semibold text-gray-900">{formatDateRange()}</span>
          </div>

          <Button
            onClick={() => navigateDate("next")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4e8f71]"></div>
            <p className="text-gray-600 mt-4">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments</h3>
            <p className="text-gray-500">No appointments found for this time period.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 cursor-pointer"
                style={{ borderLeftColor: getRiskColor(appointment.risk_level).replace("bg-", "#") }}
                onClick={() => onSelectAppointment(appointment.id.toString())}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${getRiskColor(appointment.risk_level)}`}></div>
                      <h3 className="text-xl font-bold text-gray-900">{appointment.patient_name}</h3>
                      <span className="text-sm text-gray-500">Age {appointment.patient_age || "N/A"}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(appointment.appointment_date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{appointment.care_team_role || "General"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm capitalize">{appointment.appointment_type || "Follow-up"}</span>
                      </div>
                    </div>

                    {appointment.reason && (
                      <p className="text-sm text-gray-600 italic line-clamp-2">{appointment.reason}</p>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button className="px-4 py-2 bg-gradient-to-r from-[#4e8f71] to-[#364d89] text-white rounded-lg hover:shadow-lg transition-all duration-200">
                      Open Summary
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
