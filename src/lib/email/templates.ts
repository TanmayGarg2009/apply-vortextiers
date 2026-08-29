interface BaseEmailData {
  applicantName: string;
  applicationId: string;
  positionName: string;
  modeName?: string | null;
  appUrl: string;
}

const EMAIL_BASE_CSS = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0f14; color: #e2e8f0; margin: 0; padding: 28px 16px; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #141922; border: 1px solid #232b3b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
  .header { background: linear-gradient(180deg, #1a2230 0%, #141922 100%); padding: 32px 32px 24px; border-bottom: 1px solid #232b3b; }
  .brand { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px; }
  .subtitle { font-size: 11px; color: #64748b; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; }
  .content { padding: 32px; }
  .badge { display: inline-block; background: #1f2737; border: 1px solid #3b4860; color: #f59e0b; padding: 5px 12px; border-radius: 8px; font-family: monospace; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
  .badge.accepted { background: #064e3b; border-color: #10b981; color: #34d399; }
  .badge.review { background: #1e3a8a; border-color: #3b82f6; color: #60a5fa; }
  .badge.discussion { background: #581c87; border-color: #a855f7; color: #c084fc; }
  .badge.rejected { background: #3f1d24; border-color: #f43f5e; color: #fb7185; }
  h1 { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.02em; }
  p { font-size: 15px; line-height: 1.65; color: #94a3b8; margin: 14px 0; }
  .dossier-card { background: #0b0e13; border: 1px solid #1e2638; border-radius: 12px; padding: 20px; margin: 24px 0; }
  .dossier-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .dossier-table td { padding: 6px 0; }
  .dossier-label { color: #64748b; font-weight: 500; font-size: 13px; }
  .dossier-val { color: #f1f5f9; font-weight: 700; text-align: right; }
  .quote-box { background: #121722; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
  .btn { display: inline-block; background: #f59e0b; color: #000000 !important; font-weight: 800; font-family: monospace; text-transform: uppercase; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 20px 0 10px; text-align: center; }
  .btn.accepted { background: #10b981; }
  .btn.discussion { background: #a855f7; color: #ffffff !important; }
  .footer { background: #0b0e13; padding: 24px 32px; border-top: 1px solid #1e2638; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center; }
  .footer a { color: #94a3b8; text-decoration: none; }
`;

/**
 * 1. Application Submitted (Receipt Confirmation)
 */
export function renderSubmittedEmail(data: BaseEmailData): { subject: string; html: string; text: string } {
  const subject = `Application Received: ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} — Ref #${data.applicationId}`;
  const text = `Hello ${data.applicantName},\n\nWe have received your staff application for ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}.\n\nReference ID: ${data.applicationId}\nStatus: SUBMITTED (Queued for Committee Review)\n\nTrack your application progress on your candidate portal: ${data.appUrl}/dashboard\n\nSincerely,\nVortex Recruitment Division & Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Recruitment Committee</div>
    </div>
    <div class="content">
      <div class="badge">REF: ${data.applicationId}</div>
      <h1>Application Received</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>Thank you for submitting your candidacy for the <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong> position at Vortex.</p>
      
      <div class="dossier-card">
        <table class="dossier-table">
          <tr><td class="dossier-label">Candidate:</td><td class="dossier-val">${data.applicantName}</td></tr>
          <tr><td class="dossier-label">Position:</td><td class="dossier-val">${data.positionName}</td></tr>
          ${data.modeName ? `<tr><td class="dossier-label">Discipline / Gamemode:</td><td class="dossier-val">${data.modeName}</td></tr>` : ""}
          <tr><td class="dossier-label">Application Status:</td><td class="dossier-val" style="color: #f59e0b;">SUBMITTED</td></tr>
        </table>
      </div>

      <p>Your submission has been cataloged in our recruitment queue. Our evaluation team will review your application, verified tier standings, and past experience.</p>
      
      <a href="${data.appUrl}/dashboard" class="btn">View Candidate Portal</a>
    </div>
    <div class="footer">
      Vortex Recruitment Board • Confidential & Proprietary<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a> • Official Staff Network
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * 2. Application Placed Under Active Review
 */
export function renderUnderReviewEmail(data: BaseEmailData): { subject: string; html: string; text: string } {
  const subject = `Update: Your Application is Now Under Active Evaluation — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nYour application for ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} has been moved to ACTIVE EVALUATION by the review committee.\n\nReference ID: ${data.applicationId}\n\nTrack progress: ${data.appUrl}/dashboard\n\nVortex Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Recruitment Committee</div>
    </div>
    <div class="content">
      <div class="badge review">STATUS: UNDER ACTIVE REVIEW</div>
      <h1>Candidacy Under Active Review</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>We are pleased to inform you that your staff dossier for <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong> has been assigned to our recruitment board for formal evaluation.</p>
      
      <div class="dossier-card">
        <table class="dossier-table">
          <tr><td class="dossier-label">Reference ID:</td><td class="dossier-val" style="font-family: monospace;">${data.applicationId}</td></tr>
          <tr><td class="dossier-label">Current Stage:</td><td class="dossier-val" style="color: #60a5fa;">ACTIVE COMMITTEE EVALUATION</td></tr>
        </table>
      </div>

      <p>Our reviewers are currently examining your written responses, competitive tier benchmarks, and submitted gameplay media.</p>
      
      <a href="${data.appUrl}/dashboard" class="btn">Track Review Status</a>
    </div>
    <div class="footer">
      Vortex Recruitment Board • Confidential & Proprietary<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * 3. Discussion / Interview Stage
 */
export function renderUnderDiscussionEmail(data: BaseEmailData & { interviewNote?: string | null }): { subject: string; html: string; text: string } {
  const subject = `Invitation: Candidate Interview & Discussion Stage — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nYour application for ${data.positionName} has advanced to the Interview & Discussion Stage.\n\n${data.interviewNote ? `Note from Committee: "${data.interviewNote}"\n\n` : ""}Please visit your candidate portal or reach out on our official Discord to coordinate your evaluation: ${data.appUrl}/dashboard\n\nVortex Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Interview Board</div>
    </div>
    <div class="content">
      <div class="badge discussion">STAGE: INTERVIEW & DISCUSSION</div>
      <h1>Interview Stage Invitation</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>Following our initial evaluation, your application for <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong> has advanced to the <strong>Interview & Discussion Stage</strong>.</p>
      
      ${data.interviewNote ? `<div class="quote-box"><strong>Committee Note:</strong><br/>${data.interviewNote}</div>` : ""}

      <p>A member of our senior leadership will be in touch via Discord, or you may open an applicant ticket in our official Discord server to coordinate your interview schedule.</p>
      
      <a href="${data.appUrl}/dashboard" class="btn discussion">Candidate Portal</a>
    </div>
    <div class="footer">
      Vortex Recruitment Board • Official Staff Management<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * 4. Application Accepted (Official Staff Offer)
 */
export function renderAcceptedEmail(
  data: BaseEmailData & { acceptanceMessage?: string | null }
): { subject: string; html: string; text: string } {
  const subject = `Vortex Tiers Staff Application Accepted! — [${data.applicationId}]`;
  const text = `Congratulations ${data.applicantName}!\n\nWe are excited to officially offer you the position of ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} on the Vortex team.\n\n${data.acceptanceMessage ? `Executive Remarks: "${data.acceptanceMessage}"\n\n` : ""}Please access the staff portal to begin your onboarding: ${data.appUrl}/dashboard\n\nWelcome aboard,\nVortex Executive Leadership`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Official Staff Offer</div>
    </div>
    <div class="content">
      <div class="badge accepted">STATUS: ACCEPTED</div>
      <h1>Congratulations! You've Been Accepted</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>On behalf of the Vortex Executive Leadership, we are pleased to officially extend an offer for the position of <strong style="color: #10b981;">${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong>.</p>
      
      ${data.acceptanceMessage ? `<div class="quote-box" style="border-left-color: #10b981;"><strong>Staff Remarks:</strong><br/>${data.acceptanceMessage}</div>` : ""}

      <div class="dossier-card">
        <table class="dossier-table">
          <tr><td class="dossier-label">Staff Role:</td><td class="dossier-val">${data.positionName}</td></tr>
          ${data.modeName ? `<tr><td class="dossier-label">Specialization:</td><td class="dossier-val">${data.modeName}</td></tr>` : ""}
          <tr><td class="dossier-label">Status:</td><td class="dossier-val" style="color: #10b981;">ACCEPTED & ONBOARDING</td></tr>
        </table>
      </div>

      <p>Please log in to your staff portal to complete role verification and begin initial orientation.</p>
      
      <a href="${data.appUrl}/dashboard" class="btn accepted">Access Staff Onboarding</a>
    </div>
    <div class="footer">
      Vortex Executive Leadership • Human Resources<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * 5. Application Rejected (Professional Decision Notice)
 */
export function renderRejectedEmail(
  data: BaseEmailData & { rejectionReason?: string | null }
): { subject: string; html: string; text: string } {
  const subject = `Update regarding your Vortex Tiers Staff Application — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nThank you for applying for the ${data.positionName}${data.modeName ? ` (${data.modeName})` : ""} position at Vortex.\n\nAfter careful evaluation, we regret to inform you that we are unable to offer you a position at this time.\n\n${data.rejectionReason ? `Feedback from Review Committee: "${data.rejectionReason}"\n\n` : ""}We appreciate your interest in our team and encourage you to reapply in the future once the cooldown period has elapsed.\n\nSincerely,\nVortex Recruitment Committee`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Decision Notice</div>
    </div>
    <div class="content">
      <div class="badge rejected">DECISION: NOT SELECTED</div>
      <h1>Application Decision Notice</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>Thank you for your interest in joining the staff team and for the time and effort you invested in applying for <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong>.</p>
      
      <p>After thorough review by our evaluation committee, we have determined that we are unable to move forward with your application for this cycle.</p>
      
      ${data.rejectionReason ? `<div class="quote-box" style="border-left-color: #f43f5e;"><strong>Reviewer Feedback:</strong><br/>${data.rejectionReason}</div>` : ""}

      <p>We invite you to continue participating in the community and encourage you to reapply in the future once the application cooldown period has elapsed.</p>
    </div>
    <div class="footer">
      Vortex Recruitment Board • Confidential<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * 6. Revision / Needs Changes Request
 */
export function renderNeedsChangesEmail(
  data: BaseEmailData & { requestNote?: string | null }
): { subject: string; html: string; text: string } {
  const subject = `Action Required: Revision Requested on your Application — [${data.applicationId}]`;
  const text = `Hello ${data.applicantName},\n\nOur reviewers have requested additional details or updated evidence on your application for ${data.positionName}.\n\n${data.requestNote ? `Instructions: "${data.requestNote}"\n\n` : ""}Please visit your candidate dashboard to update your submission: ${data.appUrl}/dashboard\n\nVortex Staff Management`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_BASE_CSS}</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">⚡ VORTEX TIERS & NETWORK</div>
      <div class="subtitle">Human Resources • Action Required</div>
    </div>
    <div class="content">
      <div class="badge" style="background: #451a03; border-color: #f97316; color: #fdba74;">ACTION REQUIRED</div>
      <h1>Application Revision Requested</h1>
      <p>Dear <strong style="color: #ffffff;">${data.applicantName}</strong>,</p>
      <p>Our review committee has evaluated your submission for <strong>${data.positionName}${data.modeName ? ` (${data.modeName})` : ""}</strong> and requires additional information or clarification before making a final determination.</p>
      
      ${data.requestNote ? `<div class="quote-box" style="border-left-color: #f97316;"><strong>Reviewer Instructions:</strong><br/>${data.requestNote}</div>` : ""}

      <p>Please log in to your candidate dashboard to update your responses or attach the requested evidence.</p>
      
      <a href="${data.appUrl}/dashboard" class="btn" style="background: #f97316;">Update Application</a>
    </div>
    <div class="footer">
      Vortex Recruitment Board • Action Required<br/>
      <a href="https://vortextiers.xyz">vortextiers.xyz</a>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
