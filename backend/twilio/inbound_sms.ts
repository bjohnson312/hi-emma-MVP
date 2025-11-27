import { api, Header } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { secret } from "encore.dev/config";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

interface TwilioInboundSMSRequest {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  contentType: Header<"Content-Type">;
}

export const inboundSMS = api(
  { expose: true, method: "POST", path: "/twilio/inbound-sms", auth: false },
  async (req: TwilioInboundSMSRequest): Promise<void> => {
    let MessageSid = '';
    let From = '';
    let To = '';
    let Body = '';
    
    if (req.contentType.includes('application/x-www-form-urlencoded')) {
      const bodyStr = (req as any).body || '';
      const params = new URLSearchParams(bodyStr);
      
      MessageSid = params.get('MessageSid') || '';
      From = params.get('From') || '';
      To = params.get('To') || '';
      Body = params.get('Body') || '';
    } else {
      MessageSid = req.MessageSid;
      From = req.From;
      To = req.To;
      Body = req.Body;
    }
    
    console.log(`[Twilio Inbound] MessageSid: ${MessageSid}, From: ${From}, To: ${To}, Body: ${Body.substring(0, 50)}${Body.length > 50 ? '...' : ''}`);
    
    try {
      const existing = await db.queryRow<{ id: number }>`
        SELECT id FROM messages
        WHERE external_id = ${MessageSid}
      `;
      
      if (existing) {
        console.log(`[Twilio Inbound] Already processed message ${MessageSid}, returning`);
        return;
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
        console.log(`[Twilio Inbound] Message ${MessageSid} already processed (via conflict), returning`);
        return;
      }
      
      console.log(`[Twilio Inbound] Received inbound SMS (ID: ${inboundMessage.id})`);
      
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
          
          console.log(`[Twilio Inbound] Sent auto-reply to ${From} (SID: ${result.sid})`);
          
        } catch (error) {
          console.error(`[Twilio Inbound] Failed to send auto-reply:`, error);
        }
      }
      
    } catch (error) {
      console.error(`[Twilio Inbound] Error processing webhook:`, error);
    }
  }
);
