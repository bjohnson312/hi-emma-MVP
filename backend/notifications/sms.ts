// import { secret } from "encore.dev/config";

// const twilioAccountSid = secret("TwilioAccountSid");
// const twilioAuthToken = secret("TwilioAuthToken");
// const twilioPhoneNumber = secret("TwilioPhoneNumber");

export async function sendSMS(to: string, message: string): Promise<void> {
  console.warn("Twilio SMS integration temporarily disabled. SMS not sent to:", to);
  return;
}

// export async function sendSMS(to: string, message: string): Promise<void> {
//   const accountSid = twilioAccountSid();
//   const authToken = twilioAuthToken();
//   const from = twilioPhoneNumber();

//   if (!accountSid || !authToken || !from) {
//     console.warn("Twilio credentials not configured. SMS not sent.");
//     return;
//   }

//   const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
//   
//   const params = new URLSearchParams({
//     To: to,
//     From: from,
//     Body: message,
//   });

//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
//       'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     body: params.toString(),
//   });

//   if (!response.ok) {
//     const error = await response.text();
//     throw new Error(`Twilio API error: ${error}`);
//   }
// }
