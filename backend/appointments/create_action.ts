import { api } from "encore.dev/api";
import db from "../db";
import type { CreateActionRequest, AppointmentAction } from "./types";

export const createAction = api<CreateActionRequest, AppointmentAction>(
  { expose: true, method: "POST", path: "/appointments/create-action" },
  async (req) => {
    const { appointment_id, action_type, description, assigned_to, due_date } = req;

    const action = await db.queryRow<AppointmentAction>`
      INSERT INTO appointment_actions (
        appointment_id, action_type, description, assigned_to, due_date
      )
      VALUES (
        ${appointment_id}, ${action_type}, ${description}, ${assigned_to}, ${due_date}
      )
      RETURNING id, appointment_id, action_type, description, assigned_to,
                status, due_date, completed_at, created_at
    `;

    return action!;
  }
);
