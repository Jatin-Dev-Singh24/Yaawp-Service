import nodemailer from 'nodemailer';
import { db } from './db';

export interface ClientInquiryEmailData {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  service: string;
  budgetRange?: string | null;
  timeline?: string | null;
  projectDetails?: string | null;
  websiteOrSocial?: string | null;
  createdAt: string;
}

export interface SpecialistApplicationEmailData {
  id: string;
  fullName: string;
  email: string;
  discipline: string;
  portfolioUrl: string;
  yearsOfExperience?: string | null;
  weeklyAvailability?: string | null;
  primarySkills?: string | null;
  briefBio?: string | null;
  createdAt: string;
}

export interface EmailSendResult {
  success: boolean;
  provider?: 'resend' | 'smtp' | 'none';
  messageId?: string;
  error?: string;
  reason?: 'unconfigured' | 'failed' | 'sent';
}

/**
 * Get target agency notification email recipient.
 * Checks database settings table first, falls back to AGENCY_NOTIFICATION_EMAIL env var.
 * NEVER hard-codes personal email addresses.
 */
export function getAgencyNotificationEmail(): string | null {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'agency_notification_email'").get() as
      | { value: string }
      | undefined;
    if (row && row.value && row.value.trim().length > 0) {
      return row.value.trim();
    }
  } catch (err) {
    // Database might not be initialized yet
  }
  const envEmail = process.env.AGENCY_NOTIFICATION_EMAIL?.trim();
  return envEmail && envEmail.length > 0 ? envEmail : null;
}

/**
 * Returns summary of email configuration status for diagnostics without exposing secrets.
 */
export function getEmailConfigStatus() {
  const recipient = getAgencyNotificationEmail();
  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const fromEmail = process.env.EMAIL_FROM || (resendKey ? 'YAAWP Agency <onboarding@resend.dev>' : 'YAAWP Agency <notifications@yaawp.com>');

  const hasResend = Boolean(resendKey && resendKey.trim().length > 0);
  const hasSmtp = Boolean(smtpHost && smtpUser && process.env.SMTP_PASS);
  const isConfigured = Boolean(recipient && (hasResend || hasSmtp));

  return {
    configured: isConfigured,
    recipientConfigured: Boolean(recipient),
    recipientEmail: recipient || null,
    provider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'none',
    fromEmail,
    missingFields: [
      ...(!recipient ? ['AGENCY_NOTIFICATION_EMAIL'] : []),
      ...(!hasResend && !hasSmtp ? ['EMAIL_PROVIDER_API_KEY or RESEND_API_KEY (or SMTP_HOST/SMTP_USER/SMTP_PASS)'] : []),
    ],
  };
}

/**
 * Dispatch an email through Resend API or SMTP
 */
async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  const { to, subject, text, html } = options;
  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  // 1. Try Resend if API key is provided
  if (resendKey && resendKey.trim().length > 0) {
    try {
      const from = process.env.EMAIL_FROM || 'YAAWP Agency <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      const resData = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        const errorMsg = resData?.message || resData?.error || `HTTP ${res.status} ${res.statusText}`;
        console.error(`[YAAWP Email] Resend API error: ${errorMsg}`);
        return { success: false, provider: 'resend', reason: 'failed', error: errorMsg };
      }

      console.log(`[YAAWP Email] Email delivered via Resend. ID: ${resData?.id} to ${to}`);
      return { success: true, provider: 'resend', reason: 'sent', messageId: resData?.id };
    } catch (err: any) {
      console.error(`[YAAWP Email] Resend dispatch exception:`, err);
      return { success: false, provider: 'resend', reason: 'failed', error: err?.message || String(err) };
    }
  }

  // 2. Try SMTP if configured
  if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const from = process.env.EMAIL_FROM || `"YAAWP Agency" <${process.env.SMTP_USER}>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log(`[YAAWP Email] Email delivered via SMTP. ID: ${info.messageId} to ${to}`);
      return { success: true, provider: 'smtp', reason: 'sent', messageId: info.messageId };
    } catch (err: any) {
      console.error(`[YAAWP Email] SMTP dispatch exception:`, err);
      return { success: false, provider: 'smtp', reason: 'failed', error: err?.message || String(err) };
    }
  }

  // 3. Provider not configured
  console.warn(
    `[YAAWP Email] Email notification skipped: No active email provider configured (set RESEND_API_KEY/EMAIL_PROVIDER_API_KEY or SMTP credentials). Recipient target was: ${to}`
  );
  return {
    success: false,
    provider: 'none',
    reason: 'unconfigured',
    error: 'Email provider not configured. Set RESEND_API_KEY or SMTP variables.',
  };
}

/**
 * Send notification for a newly stored client inquiry
 */
export async function sendClientInquiryEmail(
  data: ClientInquiryEmailData,
  baseUrl: string
): Promise<EmailSendResult> {
  const recipient = getAgencyNotificationEmail();
  if (!recipient) {
    console.warn(`[YAAWP Email] Cannot send inquiry email: No AGENCY_NOTIFICATION_EMAIL configured.`);
    return {
      success: false,
      provider: 'none',
      reason: 'unconfigured',
      error: 'No AGENCY_NOTIFICATION_EMAIL recipient configured.',
    };
  }

  const subject = `New YAAWP Client Inquiry — ${data.name}`;
  const workspaceUrl = `${baseUrl.replace(/\/$/, '')}/#admin`;
  const formattedTime = new Date(data.createdAt).toUTCString();

  const text = `
New YAAWP Client Inquiry — ${data.name}
==================================================

A prospective client has submitted an inquiry on the YAAWP website:

* Client Name: ${data.name}
* Email: ${data.email}
* Company: ${data.company || 'Not provided'}
* Requested Service: ${data.service}
* Budget: ${data.budgetRange || 'Not specified'}
* Timeline: ${data.timeline || 'Not specified'}
* Project Description:
${data.projectDetails || 'No additional details provided.'}

* Website / Social: ${data.websiteOrSocial || 'Not provided'}
* Submission Time: ${formattedTime}
* Lead ID: ${data.id}

Access Agency Workspace:
${workspaceUrl}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #191816; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E2D8; border-radius: 4px; padding: 32px; }
    .header { border-bottom: 2px solid #581825; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { font-size: 20px; font-weight: 600; color: #581825; margin: 0 0 4px 0; }
    .header p { font-size: 13px; color: #5C5853; margin: 0; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #5C5853; margin-bottom: 4px; }
    .value { font-size: 14px; color: #191816; font-weight: 500; }
    .box { background: #FAF8F5; border-left: 3px solid #581825; padding: 12px 16px; margin-top: 6px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .btn { display: inline-block; background-color: #581825; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }
    .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #E8E2D8; font-size: 12px; color: #8C867E; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>New Client Inquiry Received</h2>
      <p>YAAWP Services Agency Operating System</p>
    </div>

    <div class="field">
      <div class="label">Client Name</div>
      <div class="value">${escapeHtml(data.name)}</div>
    </div>

    <div class="field">
      <div class="label">Email Address</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #581825;">${escapeHtml(data.email)}</a></div>
    </div>

    <div class="field">
      <div class="label">Company / Brand</div>
      <div class="value">${escapeHtml(data.company || 'Not provided')}</div>
    </div>

    <div class="field">
      <div class="label">Requested Service</div>
      <div class="value">${escapeHtml(data.service)}</div>
    </div>

    <div style="display: flex; gap: 16px;">
      <div class="field" style="flex: 1;">
        <div class="label">Budget</div>
        <div class="value">${escapeHtml(data.budgetRange || 'Not specified')}</div>
      </div>
      <div class="field" style="flex: 1;">
        <div class="label">Timeline</div>
        <div class="value">${escapeHtml(data.timeline || 'Not specified')}</div>
      </div>
    </div>

    <div class="field">
      <div class="label">Project Description</div>
      <div class="box">${escapeHtml(data.projectDetails || 'No project description provided.')}</div>
    </div>

    <div class="field">
      <div class="label">Website / Social Link</div>
      <div class="value">${data.websiteOrSocial ? `<a href="${escapeHtml(data.websiteOrSocial)}" target="_blank" style="color: #581825;">${escapeHtml(data.websiteOrSocial)}</a>` : 'Not provided'}</div>
    </div>

    <div class="field">
      <div class="label">Submission Time</div>
      <div class="value">${formattedTime} (UTC)</div>
    </div>

    <div style="text-align: center;">
      <a href="${workspaceUrl}" class="btn">Open Agency Workspace</a>
    </div>

    <div class="footer">
      This is an automated notification from your YAAWP website client intake system.<br>
      Lead Record ID: ${escapeHtml(data.id)}
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({ to: recipient, subject, text, html });
}

/**
 * Send notification for a newly stored freelancer application
 */
export async function sendFreelancerApplicationEmail(
  data: SpecialistApplicationEmailData,
  baseUrl: string
): Promise<EmailSendResult> {
  const recipient = getAgencyNotificationEmail();
  if (!recipient) {
    console.warn(`[YAAWP Email] Cannot send application email: No AGENCY_NOTIFICATION_EMAIL configured.`);
    return {
      success: false,
      provider: 'none',
      reason: 'unconfigured',
      error: 'No AGENCY_NOTIFICATION_EMAIL recipient configured.',
    };
  }

  const subject = `New YAAWP Freelancer Application — ${data.fullName}`;
  const workspaceUrl = `${baseUrl.replace(/\/$/, '')}/#admin`;
  const formattedTime = new Date(data.createdAt).toUTCString();

  const text = `
New YAAWP Freelancer Application — ${data.fullName}
==================================================

A specialist has applied to join the YAAWP network:

* Name: ${data.fullName}
* Email: ${data.email}
* Discipline: ${data.discipline}
* Portfolio: ${data.portfolioUrl}
* Experience: ${data.yearsOfExperience || 'Not specified'}
* Availability: ${data.weeklyAvailability || 'Not specified'}
* Skills: ${data.primarySkills || 'Not specified'}
* Bio:
${data.briefBio || 'No bio provided.'}

* Submission Time: ${formattedTime}
* Specialist Record ID: ${data.id}

Review Application in Agency Workspace:
${workspaceUrl}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #191816; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E2D8; border-radius: 4px; padding: 32px; }
    .header { border-bottom: 2px solid #581825; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { font-size: 20px; font-weight: 600; color: #581825; margin: 0 0 4px 0; }
    .header p { font-size: 13px; color: #5C5853; margin: 0; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #5C5853; margin-bottom: 4px; }
    .value { font-size: 14px; color: #191816; font-weight: 500; }
    .box { background: #FAF8F5; border-left: 3px solid #581825; padding: 12px 16px; margin-top: 6px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .btn { display: inline-block; background-color: #581825; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }
    .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #E8E2D8; font-size: 12px; color: #8C867E; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>New Specialist Network Application</h2>
      <p>YAAWP Services Agency Operating System</p>
    </div>

    <div class="field">
      <div class="label">Applicant Name</div>
      <div class="value">${escapeHtml(data.fullName)}</div>
    </div>

    <div class="field">
      <div class="label">Email Address</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #581825;">${escapeHtml(data.email)}</a></div>
    </div>

    <div class="field">
      <div class="label">Primary Discipline</div>
      <div class="value">${escapeHtml(data.discipline)}</div>
    </div>

    <div class="field">
      <div class="label">Portfolio URL</div>
      <div class="value"><a href="${escapeHtml(data.portfolioUrl)}" target="_blank" style="color: #581825;">${escapeHtml(data.portfolioUrl)}</a></div>
    </div>

    <div style="display: flex; gap: 16px;">
      <div class="field" style="flex: 1;">
        <div class="label">Experience</div>
        <div class="value">${escapeHtml(data.yearsOfExperience || 'Not specified')}</div>
      </div>
      <div class="field" style="flex: 1;">
        <div class="label">Weekly Availability</div>
        <div class="value">${escapeHtml(data.weeklyAvailability || 'Not specified')}</div>
      </div>
    </div>

    <div class="field">
      <div class="label">Key Skills & Tools</div>
      <div class="value">${escapeHtml(data.primarySkills || 'Not specified')}</div>
    </div>

    <div class="field">
      <div class="label">Brief Bio / Background</div>
      <div class="box">${escapeHtml(data.briefBio || 'No bio provided.')}</div>
    </div>

    <div class="field">
      <div class="label">Submission Time</div>
      <div class="value">${formattedTime} (UTC)</div>
    </div>

    <div style="text-align: center;">
      <a href="${workspaceUrl}" class="btn">Review Application in Workspace</a>
    </div>

    <div class="footer">
      This is an automated notification from your YAAWP specialist intake system.<br>
      Specialist Record ID: ${escapeHtml(data.id)}
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({ to: recipient, subject, text, html });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
