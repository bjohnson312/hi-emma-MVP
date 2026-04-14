import { secret } from "encore.dev/config";
import twilio from "twilio";

const twilioAccountSid = secret("TwilioAccountSID");
const twilioAuthToken = secret("TwilioAuthToken");
const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
  const accountSid = twilioAccountSid();
  const authToken = twilioAuthToken();

  if (!accountSid || !authToken) {
    throw new Error("TwilioAccountSID or TwilioAuthToken secret is empty.");
  }

  const client = twilio(accountSid, authToken);

  const messageOptions: any = { to, body };

  const serviceSid = twilioMessagingServiceSid();
  if (serviceSid) {
    messageOptions.messagingServiceSid = serviceSid;
  } else {
    const fromNumber = twilioPhoneNumber();
    if (!fromNumber) {
      throw new Error("Neither TwilioMessagingServiceSID nor TwilioPhoneNumber is configured.");
    }
    messageOptions.from = fromNumber;
  }

  const twilioMessage = await client.messages.create(messageOptions);
  return { sid: twilioMessage.sid };
}
