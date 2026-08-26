interface BaseEmailData {
  applicantName: string;
  applicationId: string;
  positionName: string;
  modeName?: string | null;
  appUrl: string;
}

export function renderSubmittedEmail(data: BaseEmailData): { subject: string; html: string; text: string } {
  const subject = `Vortex Tiers Staff Application Received — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nWe have received your staff application for Vortex Tiers (${data.positionName}${data.modeName ? ` - ${data.modeName}` : ""}).\n\nYour Application ID is: ${data.applicationId}\n\nYou can track the status of your application on your dashboard: ${data.appUrl}/dashboard\n\nThank you,\nVortex Tiers Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f1319; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #171d27; border: 1px solid #283244; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; display: inline-block; }
    .badge { display: inline-block; background: #222b3a; border: 1px solid #3b4860; color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 12px 0; }
    .card { background: #111620; border: 1px solid #232b3b; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-weight: 500; }
    .val { color: #f1f5f9; font-weight: 600; }
    .btn { display: inline-block; background: #f59e0b; color: #0f1319; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; font-size: 14px; text-align: center; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #222b3a; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ VORTEX TIERS</div>
    <br/>
    <div class="badge">${data.applicationId}</div>
    <h1>Application Submitted Successfully</h1>
    <p>Hello <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
    <p>Thank you for applying to the Vortex Tiers staff team. Your submission has been securely recorded and queued for staff review.</p>
    
    <div class="card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="color: #64748b; padding: 4px 0;">Application ID:</td><td style="color: #f1f5f9; font-weight: 700; font-family: monospace; text-align: right;">${data.applicationId}</td></tr>
        <tr><td style="color: #64748b; padding: 4px 0;">Position:</td><td style="color: #f1f5f9; font-weight: 600; text-align: right;">${data.positionName}</td></tr>
        ${data.modeName ? `<tr><td style="color: #64748b; padding: 4px 0;">Game Mode:</td><td style="color: #f1f5f9; font-weight: 600; text-align: right;">${data.modeName}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 4px 0;">Current Status:</td><td style="color: #f59e0b; font-weight: 700; text-align: right;">SUBMITTED</td></tr>
      </table>
    </div>

    <p>Our review team evaluates applications based on tiering knowledge, communication, and community conduct. You will receive an update once a decision has been reached.</p>
    
    <a href="${data.appUrl}/dashboard" class="btn">View Application Status</a>

    <div class="footer">
      Vortex Tiers — Competitive Minecraft PvP Tiering & Staff Recruitment<br/>
      https://vortextiers.xyz
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html, text };
}

export function renderAcceptedEmail(
  data: BaseEmailData & { acceptanceMessage?: string | null }
): { subject: string; html: string; text: string } {
  const subject = `Vortex Tiers Staff Application Accepted! — [${data.applicationId}]`;
  const text = `Congratulations ${data.applicantName}!\n\nYour staff application for ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} on Vortex Tiers has been ACCEPTED.\n\n${data.acceptanceMessage ? `Staff Remarks: "${data.acceptanceMessage}"\n\n` : ""}Please check your dashboard or join our Discord to finalize your staff onboarding: ${data.appUrl}/dashboard\n\nWelcome to the team!\nVortex Tiers Leadership`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f1319; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #171d27; border: 1px solid #10b98144; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; display: inline-block; }
    .badge { display: inline-block; background: #064e3b; border: 1px solid #10b981; color: #10b981; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 12px 0; }
    .quote-box { background: #06271c; border-left: 3px solid #10b981; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-style: italic; color: #d1fae5; font-size: 14px; }
    .btn { display: inline-block; background: #10b981; color: #06271c; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; font-size: 14px; text-align: center; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #222b3a; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ VORTEX TIERS</div>
    <br/>
    <div class="badge">STATUS: ACCEPTED</div>
    <h1>Congratulations, You've Been Accepted!</h1>
    <p>Hello <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
    <p>We are pleased to inform you that your application for <strong style="color: #10b981;">${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong> has been <strong>Accepted</strong>.</p>
    
    ${data.acceptanceMessage ? `<div class="quote-box">"${data.acceptanceMessage}"</div>` : ""}

    <p>Please log in to your staff dashboard or reach out via our official Discord to begin your staff orientation and role assignment.</p>
    
    <a href="${data.appUrl}/dashboard" class="btn">Access Staff Portal</a>

    <div class="footer">
      Vortex Tiers — Competitive Minecraft PvP Tiering & Staff Recruitment<br/>
      https://vortextiers.xyz
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html, text };
}

export function renderRejectedEmail(
  data: BaseEmailData & { rejectionReason?: string | null }
): { subject: string; html: string; text: string } {
  const subject = `Update regarding your Vortex Tiers Staff Application — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nThank you for taking the time to apply for ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} on Vortex Tiers.\n\nAfter review, we are unable to offer you a staff position at this time.\n\n${data.rejectionReason ? `Feedback from Reviewers: "${data.rejectionReason}"\n\n` : ""}We encourage you to continue participating in the community and reapply in the future once the cooldown period has elapsed.\n\nBest regards,\nVortex Tiers Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f1319; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #171d27; border: 1px solid #283244; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { color: #f59e0b; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; display: inline-block; }
    .badge { display: inline-block; background: #222b3a; border: 1px solid #3b4860; color: #94a3b8; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 12px 0; }
    .feedback-box { background: #1e2430; border-left: 3px solid #64748b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #cbd5e1; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #222b3a; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ VORTEX TIERS</div>
    <br/>
    <div class="badge">${data.applicationId}</div>
    <h1>Application Update</h1>
    <p>Hello <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
    <p>Thank you for your interest in joining the Vortex Tiers staff team and for taking the time to submit an application for <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong>.</p>
    <p>After reviewing your submission, we have decided not to move forward with your application at this time.</p>
    
    ${data.rejectionReason ? `
    <div class="feedback-box">
      <strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 13px;">Reviewer Feedback:</strong>
      ${data.rejectionReason}
    </div>` : ""}

    <p>We appreciate your dedication to the Vortex Tiers community and invite you to reapply in the future once the application cooldown period has elapsed.</p>

    <div class="footer">
      Vortex Tiers — Competitive Minecraft PvP Tiering & Staff Recruitment<br/>
      https://vortextiers.xyz
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html, text };
}
