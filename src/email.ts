/**
 * Email Service - Resend Integration
 * Uses Resend API for transactional emails
 * https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/
 */

import { Env } from './saas-types';

// ============================================
// Types
// ============================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string };
}

// ============================================
// Email Service
// ============================================

/**
 * Send an email using Resend API
 * Returns true if sent successfully, false if email is not configured or failed
 */
export async function sendEmail(env: Env, options: EmailOptions): Promise<boolean> {
  // Check if email is configured
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log('[EMAIL] Email not configured, skipping send');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const result = await response.json() as ResendResponse;

    if (!response.ok) {
      console.error(`[EMAIL] Failed to send email: ${result.error?.message || 'Unknown error'}`);
      return false;
    }

    console.log(`[EMAIL] Email sent successfully to ${options.to}, ID: ${result.id}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Error sending email: ${error.message}`);
    return false;
  }
}

// ============================================
// Email Templates
// ============================================

const BRAND_NAME = 'n8n Management MCP';
const DASHBOARD_URL = 'https://n8n-management-dashboard.node2flow.net';

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 12px; border: 1px solid #2a2a2a;">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo/Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f97316; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
              </div>

              <!-- Content -->
              ${content}

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a2a; text-align: center;">
                <p style="color: #737373; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                </p>
                <p style="color: #737373; font-size: 12px; margin: 10px 0 0 0;">
                  <a href="${DASHBOARD_URL}" style="color: #f97316; text-decoration: none;">Dashboard</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Welcome email for new users
 */
export function welcomeEmail(email: string): EmailOptions {
  return {
    to: email,
    subject: `Welcome to ${BRAND_NAME}!`,
    html: baseTemplate(`
      <h2 style="color: #fafafa; margin: 0 0 20px 0; font-size: 20px;">Welcome aboard!</h2>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for creating your ${BRAND_NAME} account. You're now ready to connect your AI assistants to n8n automation workflows.
      </p>

      <div style="background-color: #1f1f1f; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #fafafa; margin: 0 0 15px 0; font-size: 16px;">Getting Started:</h3>
        <ol style="color: #a3a3a3; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Add your n8n instance in the Dashboard</li>
          <li>Get your API key (starts with <code style="background: #0a0a0a; padding: 2px 6px; border-radius: 4px; color: #f97316;">n2f_</code>)</li>
          <li>Configure your MCP client (Claude Desktop, Cursor, etc.)</li>
          <li>Start automating with AI!</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${DASHBOARD_URL}/dashboard" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Go to Dashboard
        </a>
      </div>

      <p style="color: #737373; font-size: 14px; margin: 0;">
        If you have any questions, check out our <a href="${DASHBOARD_URL}/docs" style="color: #f97316; text-decoration: none;">documentation</a> or <a href="${DASHBOARD_URL}/faq" style="color: #f97316; text-decoration: none;">FAQ</a>.
      </p>
    `),
  };
}

/**
 * Account deletion scheduled email
 */
export function deletionScheduledEmail(email: string, deletionDate: string): EmailOptions {
  const formattedDate = new Date(deletionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    to: email,
    subject: `Your ${BRAND_NAME} account is scheduled for deletion`,
    html: baseTemplate(`
      <h2 style="color: #fafafa; margin: 0 0 20px 0; font-size: 20px;">Account Deletion Scheduled</h2>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        Your ${BRAND_NAME} account has been scheduled for deletion. All your data, connections, and API keys will be permanently removed on:
      </p>

      <div style="background-color: #7f1d1d; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #fca5a5; margin: 0; font-size: 18px; font-weight: 600;">
          ${formattedDate}
        </p>
      </div>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        <strong style="color: #fafafa;">Changed your mind?</strong> You can cancel the deletion and recover your account within the next 30 days by logging in and clicking "Cancel Deletion" in Settings.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${DASHBOARD_URL}/settings" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Recover My Account
        </a>
      </div>

      <p style="color: #737373; font-size: 14px; margin: 0;">
        If you didn't request this deletion, please log in immediately to secure your account.
      </p>
    `),
  };
}

/**
 * Usage limit warning email (80% of daily limit)
 */
export function usageLimitWarningEmail(email: string, used: number, limit: number): EmailOptions {
  const percentage = Math.round((used / limit) * 100);

  return {
    to: email,
    subject: `Usage Alert: ${percentage}% of daily limit used`,
    html: baseTemplate(`
      <h2 style="color: #fafafa; margin: 0 0 20px 0; font-size: 20px;">Usage Limit Warning</h2>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        You've used <strong style="color: #f97316;">${percentage}%</strong> of your daily request limit for ${BRAND_NAME}.
      </p>

      <div style="background-color: #1f1f1f; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #a3a3a3;">Used today:</span>
          <span style="color: #fafafa; font-weight: 600;">${used.toLocaleString()} requests</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <span style="color: #a3a3a3;">Daily limit:</span>
          <span style="color: #fafafa; font-weight: 600;">${limit.toLocaleString()} requests</span>
        </div>
        <div style="background-color: #0a0a0a; border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background-color: ${percentage >= 90 ? '#dc2626' : '#f97316'}; height: 100%; width: ${percentage}%;"></div>
        </div>
      </div>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        Your limit resets at midnight UTC. To avoid hitting your limit, consider upgrading your plan for higher limits.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${DASHBOARD_URL}/usage" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          View Usage Details
        </a>
      </div>
    `),
  };
}

/**
 * Account recovered email
 */
export function accountRecoveredEmail(email: string): EmailOptions {
  return {
    to: email,
    subject: `Your ${BRAND_NAME} account has been recovered`,
    html: baseTemplate(`
      <h2 style="color: #fafafa; margin: 0 0 20px 0; font-size: 20px;">Account Recovered!</h2>

      <div style="background-color: #14532d; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #86efac; margin: 0; font-size: 16px;">
          ✓ Your account deletion has been cancelled
        </p>
      </div>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        Good news! Your ${BRAND_NAME} account has been successfully recovered. All your data, connections, and settings are intact.
      </p>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        <strong style="color: #fafafa;">Note:</strong> Your API keys were revoked during the deletion process. You may need to generate new API keys in the Dashboard.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${DASHBOARD_URL}/connections" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Manage API Keys
        </a>
      </div>
    `),
  };
}

/**
 * Connection deleted due to inactivity (Free plan only)
 */
export function connectionDeletedEmail(email: string, connectionName: string): EmailOptions {
  return {
    to: email,
    subject: `Connection "${connectionName}" removed due to inactivity`,
    html: baseTemplate(`
      <h2 style="color: #fafafa; margin: 0 0 20px 0; font-size: 20px;">Connection Removed</h2>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        Your n8n connection <strong style="color: #fafafa;">"${connectionName}"</strong> has been automatically removed due to 14 days of inactivity.
      </p>

      <div style="background-color: #1f1f1f; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #a3a3a3; margin: 0 0 10px 0;">
          <strong style="color: #fafafa;">Why did this happen?</strong>
        </p>
        <p style="color: #a3a3a3; margin: 0; line-height: 1.6;">
          As a Free plan user, connections that haven't been used for 2 weeks are automatically cleaned up to maintain system performance.
        </p>
      </div>

      <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 20px 0;">
        <strong style="color: #f97316;">Want to keep your connections?</strong> Upgrade to Pro for unlimited connection retention, higher API limits, and priority support.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${DASHBOARD_URL}/billing" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 10px;">
          Upgrade to Pro
        </a>
        <a href="${DASHBOARD_URL}/connections" style="display: inline-block; background-color: transparent; color: #f97316; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500; border: 1px solid #f97316;">
          Add New Connection
        </a>
      </div>

      <p style="color: #737373; font-size: 14px; margin: 0;">
        You can always add a new connection from the Dashboard whenever you're ready to continue automating.
      </p>
    `),
  };
}
