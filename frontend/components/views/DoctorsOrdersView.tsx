import { useState, useEffect } from "react";
import { Stethoscope, Pill, Activity, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { DoctorsOrder } from "~backend/wellness/types";

interface DoctorsOrdersViewProps {
  userId: string;
}

export default function DoctorsOrdersView({ userId }: DoctorsOrdersViewProps) {
  const [orders, setOrders] = useState<DoctorsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedToday, setLoggedToday] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await backend.wellness.getActiveDoctorsOrders({ user_id: userId });
      setOrders(response.orders);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({
        title: "Error",
        description: "Failed to load doctor's orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logMedication = async (orderId: number) => {
    try {
      await backend.wellness.logMedication({
        user_id: userId,
        doctors_order_id: orderId
      });
      setLoggedToday(prev => new Set(prev).add(orderId));
      toast({
        title: "Success",
        description: "Medication logged successfully"
      });
    } catch (error) {
      console.error("Failed to log medication:", error);
      toast({
        title: "Error",
        description: "Failed to log medication",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#4e8f71]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-[#4e8f71]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#323e48]">Doctor's Orders</h2>
            <p className="text-sm text-[#4e8f71]">Medications & activities</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-[#364d89]" />
              <h3 className="font-semibold text-[#323e48]">Medications</h3>
            </div>
            {orders.length === 0 ? (
              <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 text-center">
                <p className="text-[#323e48]/60">No medications logged yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-[#323e48]">{order.medication_name}</p>
                      <div className="flex items-center gap-2">
                        {order.time_of_day.map((time, idx) => (
                          <span key={idx} className="text-xs bg-white/90 px-3 py-1 rounded-full text-[#4e8f71]">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#323e48]/70 mb-3">{order.dosage} - {order.frequency}</p>
                    <Button
                      onClick={() => logMedication(order.id)}
                      disabled={loggedToday.has(order.id)}
                      size="sm"
                      className="w-full bg-white/90 border-[#4e8f71]/30 text-[#4e8f71] hover:bg-white shadow-lg"
                    >
                      {loggedToday.has(order.id) ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Logged Today
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Log Taken
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
