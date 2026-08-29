import { db } from '../db/memoryStore';
import { realtimeHub } from '../websocket/hub';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  error?: string;
  mode: 'TWILIO_LIVE' | 'SIMULATED_LOG';
}

export class NotificationService {
  private get accountSid() {
    return process.env.TWILIO_ACCOUNT_SID;
  }
  private get authToken() {
    return process.env.TWILIO_AUTH_TOKEN;
  }
  private get fromNumber() {
    return process.env.TWILIO_PHONE_NUMBER;
  }

  public isTwilioConfigured(): boolean {
    return Boolean(
      this.accountSid &&
      this.accountSid.startsWith('AC') &&
      this.authToken &&
      this.fromNumber
    );
  }

  /**
   * Send emergency SMS alert via Twilio REST API
   */
  async sendEmergencySms(to: string, messageBody: string): Promise<SmsSendResult> {
    if (!this.isTwilioConfigured()) {
      console.log(`[Notification Service] Twilio not fully configured. Logging alert for ${to}: "${messageBody.slice(0, 60)}..."`);
      return {
        success: true,
        recipient: to,
        mode: 'SIMULATED_LOG'
      };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', this.fromNumber!);
      params.append('Body', `[AegisOps 112 ALERT] ${messageBody}`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data: any = await res.json();

      if (res.ok && data.sid) {
        console.log(`[Twilio SMS Sent] Message SID: ${data.sid} to ${to}`);
        return {
          success: true,
          messageId: data.sid,
          recipient: to,
          mode: 'TWILIO_LIVE'
        };
      } else {
        console.warn(`[Twilio SMS Notice] Status: ${res.status}, Message: ${data.message}`);
        return {
          success: false,
          recipient: to,
          error: data.message,
          mode: 'TWILIO_LIVE'
        };
      }
    } catch (err: any) {
      console.error('[Twilio SMS Error]', err.message);
      return {
        success: false,
        recipient: to,
        error: err.message,
        mode: 'TWILIO_LIVE'
      };
    }
  }
}

export const notificationService = new NotificationService();
