import { useState, useEffect } from "react";
import { Pill, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "@/lib/backend-client";

interface DoctorsOrdersViewProps {
  userId: string;
}

interface DoctorsOrder {
  id: number;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  start_date: Date;
  end_date?: Date;
  prescribing_doctor?: string;
  notes?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export default function DoctorsOrdersView({ userId }: DoctorsOrdersViewProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DoctorsOrder[]>([]);
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
      console.error("Failed to load doctor's orders:", error);
      toast({
        title: "Error",
        description: "Failed to load doctor's orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logMedication = async (orderId: number) => {
    try {
      await backend.wellness.logMedication({
        user_id: userId,
        doctors_order_id: orderId,
        scheduled_time: new Date(),
      });
      toast({
        title: "Success",
        description: "Medication logged successfully",
      });
    } catch (error) {
      console.error("Failed to log medication:", error);
      toast({
        title: "Error",
        description: "Failed to log medication",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Pill className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Doctor's Orders</h1>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Medication
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">No medications yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your prescribed medications to keep track of your treatment plan.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Medication
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {order.medication_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {order.dosage} • {order.frequency}
                  </p>
                  {order.time_of_day && order.time_of_day.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      {order.time_of_day.join(", ")}
                    </div>
                  )}
                  {order.prescribing_doctor && (
                    <p className="text-sm text-muted-foreground">
                      Prescribed by: {order.prescribing_doctor}
                    </p>
                  )}
                  {order.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {order.notes}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => logMedication(order.id)}
                  className="ml-4"
                >
                  Log Taken
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> This feature is for tracking purposes only. Always
          follow your healthcare provider's instructions and consult them for any
          questions about your medications.
        </p>
      </div>
    </div>
  );
}
