import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAIL = 'stenpal@gmail.com';
const FROM_EMAIL = 'alerts@resend.dev'; // Use your domain after verifying with Resend

interface ErrorDetails {
  action: string;
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  userAgent?: string;
  timestamp: string;
}

export async function sendErrorNotification(error: ErrorDetails) {
  if (!resend) {
    console.log('[Email] Resend not configured, skipping error notification');
    return;
  }

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🚨 REDACTED Error: ${error.action}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a1a1a; color: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <h2 style="margin: 0 0 20px 0; color: #ef4444;">🚨 Error Alert</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #888; width: 100px;">Action:</td>
                <td style="padding: 8px 0; color: #fff;">${error.action}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888;">Time:</td>
                <td style="padding: 8px 0; color: #fff;">${error.timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888;">User ID:</td>
                <td style="padding: 8px 0; color: #fff;">${error.userId || 'Anonymous'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888;">Session:</td>
                <td style="padding: 8px 0; color: #fff; font-family: monospace; font-size: 12px;">${error.sessionId || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888;">Page:</td>
                <td style="padding: 8px 0; color: #fff;">${error.pageUrl || '-'}</td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #2a2020; border-radius: 6px;">
              <p style="margin: 0 0 10px 0; color: #ef4444; font-weight: 600;">Error Message:</p>
              <pre style="margin: 0; color: #fca5a5; white-space: pre-wrap; word-break: break-word; font-size: 13px;">${error.errorMessage}</pre>
            </div>

            ${error.errorStack ? `
            <div style="margin-top: 15px; padding: 15px; background: #1f1f1f; border-radius: 6px;">
              <p style="margin: 0 0 10px 0; color: #888; font-weight: 600;">Stack Trace:</p>
              <pre style="margin: 0; color: #666; white-space: pre-wrap; word-break: break-word; font-size: 11px; max-height: 200px; overflow-y: auto;">${error.errorStack}</pre>
            </div>
            ` : ''}

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/logs?auth=redacted2026" 
                 style="display: inline-block; padding: 10px 20px; background: #f59e0b; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Error Log →
              </a>
            </div>
          </div>
          
          <p style="margin-top: 15px; color: #666; font-size: 12px; text-align: center;">
            REDACTED Admin Alerts • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error('[Email] Failed to send error notification:', sendError);
    } else {
      console.log('[Email] Error notification sent:', data?.id);
    }
  } catch (err) {
    console.error('[Email] Error sending notification:', err);
  }
}

// Throttle to avoid spamming - max 1 email per error type per 5 minutes
const recentErrors = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function sendThrottledErrorNotification(error: ErrorDetails) {
  const key = `${error.action}:${error.errorMessage?.slice(0, 50)}`;
  const lastSent = recentErrors.get(key);
  
  if (lastSent && Date.now() - lastSent < THROTTLE_MS) {
    console.log('[Email] Throttled - same error sent recently');
    return;
  }
  
  recentErrors.set(key, Date.now());
  
  // Clean up old entries
  for (const [k, time] of recentErrors.entries()) {
    if (Date.now() - time > THROTTLE_MS) {
      recentErrors.delete(k);
    }
  }
  
  await sendErrorNotification(error);
}
