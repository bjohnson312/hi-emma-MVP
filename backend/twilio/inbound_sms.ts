import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { secret } from "encore.dev/config";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export interface TwilioInboundSMSRequest {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
}

export const inboundSMS = api(
  { expose: true, method: "POST", path: "/twilio/inbound-sms", auth: false },
  async (req: TwilioInboundSMSRequest): Promise<{ twiml: string }> => {
    const { MessageSid, From, To, Body } = req;
    
    const existing = await db.queryRow<{ id: number }>`
      SELECT id FROM messages
      WHERE external_id = ${MessageSid}
    `;
    
    if (existing) {
      console.log(`Already processed message ${MessageSid}, returning TwiML`);
      return {
        twiml: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
      };
    }
    
    const inboundMessage = await db.queryRow<{ id: number }>`
      INSERT INTO messages (
        channel, direction, "to", "from", body, status, external_id, metadata
      ) VALUES (
        'sms',
        'inbound',
        ${To},
        ${From},
        ${Body},
        'received',
        ${MessageSid},
        ${JSON.stringify({ source: 'twilio_webhook' })}
      )
      ON CONFLICT (external_id) DO NOTHING
      RETURNING id
    `;
    
    if (!inboundMessage) {
      console.log(`Message ${MessageSid} already processed (via conflict), returning TwiML`);
      return {
        twiml: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
      };
    }
    
    console.log(`Received inbound SMS (ID: ${inboundMessage.id}): ${Body.substring(0, 50)}...`);
    
    const normalized = Body.trim().toLowerCase().replace(/^hi,\s*/i, 'hi ');
    
    if (normalized.startsWith('hi emma')) {
      const replyBody = "Hi, I'm Emma. Thanks for reaching out. I'm your personal wellness companion. I'll send your daily check-in link here soon. Reply STOP to opt out.";
      
      try {
        let fromIdentifier: string;
        try {
          const serviceSid = twilioMessagingServiceSid();
          fromIdentifier = serviceSid || twilioPhoneNumber();
        } catch {
          fromIdentifier = twilioPhoneNumber();
        }
        
        const result = await sendSMS(From, replyBody);
        
        await db.exec`
          INSERT INTO messages (
            channel, direction, "to", "from", body, status, external_id, metadata
          ) VALUES (
            'sms',
            'outbound',
            ${From},
            ${fromIdentifier},
            ${replyBody},
            'sent',
            ${result.sid},
            ${JSON.stringify({ 
              auto_reply: true, 
              triggered_by_message_id: inboundMessage.id,
              trigger: 'hi_emma'
            })}
          )
        `;
        
        console.log(`Sent auto-reply to ${From} (SID: ${result.sid})`);
        
      } catch (error) {
        console.error("Failed to send auto-reply:", error);
      }
    }
    
    return {
      twiml: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };
  }
);
