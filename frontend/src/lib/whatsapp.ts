import fs from "fs";
import path from "path";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "+14155238886";

/**
 * Sends a WhatsApp notification to a member.
 * Falls back to a mock file log if Twilio credentials are not provided.
 * 
 * @param to Phone number of the member (e.g. "+919876543210")
 * @param message The message text to send
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  if (!to) {
    console.warn("[WhatsApp API] Recipient phone number is missing. Skipping notification.");
    return false;
  }

  // Standardize WhatsApp phone formats
  const cleanTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const cleanFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;

  const isConfigured = !!(accountSid && authToken);

  if (isConfigured) {
    try {
      console.log(`[WhatsApp API] Sending WhatsApp message to ${cleanTo} via Twilio...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const bodyParams = new URLSearchParams();
      bodyParams.append("To", cleanTo);
      bodyParams.append("From", cleanFrom);
      bodyParams.append("Body", message);

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("[WhatsApp API] Twilio error response:", data);
        return false;
      }
      console.log("[WhatsApp API] Message sent successfully via Twilio. SID:", data.sid);
      return true;
    } catch (err) {
      console.error("[WhatsApp API] Request error calling Twilio API:", err);
      // Fall through to Mock Logger
    }
  }

  // MOCK MODE FALLBACK
  const logDir = process.cwd();
  const logFile = path.resolve(logDir, "whatsapp_mock_logs.txt");
  const logEntry = `[${new Date().toISOString()}] TO: ${cleanTo} | FROM: ${cleanFrom}\nMESSAGE:\n${message}\n------------------------------------------------------------\n\n`;

  console.log(`\n================= [MOCK WHATSAPP NOTIFICATION] =================\nTo: ${cleanTo}\nFrom: ${cleanFrom}\nMessage:\n${message}\n================================================================\n`);

  try {
    fs.appendFileSync(logFile, logEntry, "utf8");
  } catch (err) {
    console.error("[WhatsApp API] Failed to write mock WhatsApp log file:", err);
  }

  return true;
}
