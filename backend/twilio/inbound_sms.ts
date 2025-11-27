import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { secret } from "encore.dev/config";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export const inboundSMS = api.raw(
  { expose: true, method: "POST", path: "/twilio/inbound-sms" },
  async (req, resp) => {
    console.log('[Twilio Inbound] Webhook received');
    
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyText = Buffer.concat(chunks).toString('utf-8');
    
    console.log('[Twilio Inbound] raw body:', bodyText.substring(0, 200));
    
    const params = new URLSearchParams(bodyText);
    
    const MessageSid = params.get('MessageSid') || params.get('SmsMessageSid') || '';
    const From = params.get('From') || '';
    const To = params.get('To') || '';
    const Body = params.get('Body') || '';
    
    console.log(`[Twilio Inbound] MessageSid: ${MessageSid}, From: ${From}, To: ${To}, Body: ${Body}`);
    
    if (!MessageSid || !From || !To || !Body) {
      console.error('[Twilio Inbound] Missing required fields');
      resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
      resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      return;
    }
    
    try {
      const existing = await db.queryRow<{ id: number }>`
        SELECT id FROM messages
        WHERE external_id = ${MessageSid}
      `;
      
      if (existing) {
        console.log(`[Twilio Inbound] Already processed message ${MessageSid}`);
        resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
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
        console.log(`[Twilio Inbound] Message ${MessageSid} already processed (via conflict)`);
        resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }
      
      console.log(`[Twilio Inbound] Received inbound SMS (ID: ${inboundMessage.id})`);
      
      const normalized = Body.trim().toLowerCase().replace(/^hi,\s*/i, 'hi ');
      
      if (normalized.startsWith('hi emma')) {
        const replyBody = "Hi, I'm Emma. Thanks for reaching out. I'm your personal wellness companion. I'll send your daily check-in link here soon. Brian appreciates you helping me be the best I can be! - Health is wealth, invest in yourself.\n\nEmma Health App: https://staging-hi-emma-morning-routine-f5ci.frontend.encr.app";
        
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
    
    resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
    resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
);
