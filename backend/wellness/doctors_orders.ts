import { api } from "encore.dev/api";
import db from "../db";
import type { CreateDoctorsOrderRequest, DoctorsOrder, GetLogsRequest, LogMedicationRequest, MedicationLog } from "./types";
import { autoCreateMedicationEntry } from "../wellness_journal/auto_create";

export const createDoctorsOrder = api<CreateDoctorsOrderRequest, DoctorsOrder>(
  { expose: true, method: "POST", path: "/wellness/doctors-orders" },
  async (req) => {
    const { user_id, medication_name, dosage, frequency, time_of_day, start_date, end_date, prescribing_doctor, notes } = req;

    const result = await db.queryRow<DoctorsOrder>`
      INSERT INTO doctors_orders 
        (user_id, medication_name, dosage, frequency, time_of_day, start_date, end_date, prescribing_doctor, notes)
      VALUES 
        (${user_id}, ${medication_name}, ${dosage}, ${frequency}, ${time_of_day}, 
         ${start_date}, ${end_date || null}, ${prescribing_doctor || null}, ${notes || null})
      RETURNING id, user_id, medication_name, dosage, frequency, time_of_day, 
                start_date, end_date, prescribing_doctor, notes, active, created_at, updated_at
    `;

    return result!;
  }
);

interface GetActiveDoctorsOrdersResponse {
  orders: DoctorsOrder[];
}

export const getActiveDoctorsOrders = api<GetLogsRequest, GetActiveDoctorsOrdersResponse>(
  { expose: true, method: "GET", path: "/wellness/doctors-orders/:user_id" },
  async (req) => {
    const { user_id } = req;

    const ordersQuery = await db.query<DoctorsOrder>`
      SELECT id, user_id, medication_name, dosage, frequency, time_of_day, 
             start_date, end_date, prescribing_doctor, notes, active, created_at, updated_at
      FROM doctors_orders
      WHERE user_id = ${user_id} AND active = true
      ORDER BY created_at DESC
    `;
    const orders = [];
    for await (const order of ordersQuery) {
      orders.push(order);
    }

    return { orders };
  }
);

export const logMedication = api<LogMedicationRequest, MedicationLog>(
  { expose: true, method: "POST", path: "/wellness/medication-log" },
  async (req) => {
    const { user_id, doctors_order_id, scheduled_time, notes } = req;

    const result = await db.queryRow<MedicationLog>`
      INSERT INTO medication_logs 
        (user_id, doctors_order_id, scheduled_time, notes)
      VALUES 
        (${user_id}, ${doctors_order_id || null}, ${scheduled_time || null}, ${notes || null})
      RETURNING id, user_id, doctors_order_id, taken_at, scheduled_time, notes, created_at
    `;

    if (doctors_order_id) {
      const order = await db.queryRow<{ medication_name: string; dosage: string }>`
        SELECT medication_name, dosage FROM doctors_orders WHERE id = ${doctors_order_id}
      `;
      
      if (order) {
        await autoCreateMedicationEntry(
          user_id,
          order.medication_name,
          order.dosage,
          result!.id
        );
      }
    }

    return result!;
  }
);
