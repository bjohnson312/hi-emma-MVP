// import { api } from "encore.dev/api";
// import { morning } from "~encore/clients";

// interface TwilioRequest {
//   From: string;
//   Body: string;
//   MessageSid?: string;
// }

// interface TwilioResponse {
//   message: string;
// }

// // Webhook endpoint for Twilio SMS integration.
// export const sms = api<TwilioRequest, TwilioResponse>(
//   { expose: true, method: "POST", path: "/twilio/sms" },
//   async (req) => {
//     const userId = req.From;
//     const userMessage = req.Body.toLowerCase().trim();

//     // Simple state machine based on message content
//     let sleepQuality: "good" | "okay" | "poor" | undefined;
//     
//     if (userMessage.includes("good") || userMessage.includes("great") || userMessage.includes("well")) {
//       sleepQuality = "good";
//     } else if (userMessage.includes("okay") || userMessage.includes("fine") || userMessage.includes("alright")) {
//       sleepQuality = "okay";
//     } else if (userMessage.includes("poor") || userMessage.includes("bad") || userMessage.includes("terrible") || userMessage.includes("not well")) {
//       sleepQuality = "poor";
//     }

//     // If we detected sleep quality, process the response
//     if (sleepQuality) {
//       const response = await morning.checkIn({
//         user_id: userId,
//         step: "process_response",
//         sleep_quality: sleepQuality
//       });

//       return { message: response.emma_reply };
//     }

//     // Otherwise, send greeting
//     const response = await morning.checkIn({
//       user_id: userId,
//       step: "greeting"
//     });

//     return { message: response.emma_reply };
//   }
// );
