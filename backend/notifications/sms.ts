import { secret } from "encore.dev/config";
import twilio from "twilio";

const twilioAccountSid = secret("TwilioAccountSID");
const twilioAuthToken = secret("TwilioAuthToken");
const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
  let accountSid: string;
  let authToken: string;
  
  try {
    accountSid = twilioAccountSid();
    authToken = twilioAuthToken();
    
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }
  } catch (err) {
    console.warn("Twilio credentials not configured. SMS not sent to:", to);
    throw new Error("Twilio not configured. Please add TwilioAccountSID and TwilioAuthToken to Settings.");
  }
  
  const client = twilio(accountSid, authToken);
  
  const messageOptions: any = {
    to,
    body
  };
  
  try {
    const serviceSid = twilioMessagingServiceSid();
    if (serviceSid) {
      messageOptions.messagingServiceSid = serviceSid;
    } else {
      messageOptions.from = twilioPhoneNumber();
    }
  } catch {
    try {
      messageOptions.from = twilioPhoneNumber();
    } catch {
      throw new Error("Neither TwilioMessagingServiceSID nor TwilioPhoneNumber configured");
    }
  }
  
  const twilioMessage = await client.messages.create(messageOptions);
  
  return { sid: twilioMessage.sid };
}
