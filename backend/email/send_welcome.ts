import { api } from "encore.dev/api";

export interface SendWelcomeEmailRequest {
  email: string;
  userId: string;
}

export const sendWelcomeEmail = api<SendWelcomeEmailRequest, void>(
  { expose: false, method: "POST", path: "/email/welcome" },
  async (req): Promise<void> => {
    console.log(`📧 Sending welcome email to: ${req.email}`);
    console.log(`Welcome to Hi, Emma!`);
    console.log(`User ID: ${req.userId}`);
    console.log(`---`);
    console.log(`Subject: Welcome to Hi, Emma!`);
    console.log(`Body: Hi there! Welcome to Hi, Emma - your personal wellness companion.`);
    console.log(`We're excited to have you on board!`);
  }
);
