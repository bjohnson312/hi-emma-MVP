import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import type { SendTestSMSRequest, SendTestSMSResponse } from "./messages_types";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export const sendTestSMS = api(
  { expose: true, method: "POST", path: "/admin/messages/send-test-sms", auth: false },
  async (req: SendTestSMSRequest): Promise<SendTestSMSResponse> => {
    const { to, body } = req;
    
    if (!to.startsWith('+')) {
      return {
        success: false,
        error: 'Phone number must include country code (e.g., +1234567890)'
      };
    }
    
    let fromIdentifier: string;
    try {
      const serviceSid = twilioMessagingServiceSid();
      fromIdentifier = serviceSid || twilioPhoneNumber();
    } catch {
      try {
        fromIdentifier = twilioPhoneNumber();
      } catch {
        return {
          success: false,
          error: 'Twilio secrets not configured. Please add TwilioAccountSID, TwilioAuthToken, and TwilioMessagingServiceSID (or TwilioPhoneNumber) to Settings.'
        };
      }
    }
    
    const message = await db.queryRow<{ id: number }>`
      INSERT INTO messages (
        channel, direction, "to", "from", body, status, metadata
      ) VALUES (
        'sms',
        'outbound',
        ${to},
        ${fromIdentifier},
        ${body},
        'pending',
        ${JSON.stringify({ sent_from: 'admin_test' })}
      )
      RETURNING id
    `;
    
    if (!message) {
      return { success: false, error: 'Failed to create message record' };
    }
    
    try {
      const result = await sendSMS(to, body);
      
      await db.exec`
        UPDATE messages
        SET status = 'sent', external_id = ${result.sid}
        WHERE id = ${message.id}
      `;
      
      return {
        success: true,
        message_id: message.id,
        external_id: result.sid
      };
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown Twilio error';
      
      await db.exec`
        UPDATE messages
        SET status = 'failed', error = ${errorMessage}
        WHERE id = ${message.id}
      `;
      
      return {
        success: false,
        message_id: message.id,
        error: errorMessage
      };
    }
  }
);
