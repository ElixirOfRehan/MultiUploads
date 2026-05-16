import { Resend } from "resend";

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  cachedClient = new Resend(key);
  return cachedClient;
}

function getFrom() {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  return from;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildVerificationHtml({ name, url }) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0f;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#14141a;border:1px solid #26262f;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">Verify your MultiUploads email</h1>
                <p style="margin:0 0 20px 0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                  Hi ${safeName}, please confirm this email address belongs to you so we can secure your account and send you upload notifications.
                </p>
                <p style="margin:0 0 24px 0;">
                  <a href="${safeUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:8px;">Verify email address</a>
                </p>
                <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;">This link expires in 24 hours.</p>
                <p style="margin:0 0 0 0;font-size:12px;color:#71717a;word-break:break-all;">If the button does not work, paste this URL into your browser:<br/><span style="color:#a1a1aa;">${safeUrl}</span></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#52525b;">If you did not sign up for MultiUploads, you can safely ignore this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildVerificationText({ name, url }) {
  return [
    `Hi ${name || "there"},`,
    ``,
    `Please verify your MultiUploads email address by opening this link:`,
    url,
    ``,
    `This link expires in 24 hours.`,
    `If you did not sign up for MultiUploads, you can ignore this email.`,
  ].join("\n");
}

export async function sendVerificationEmail({ to, name, url }) {
  if (!to) throw new Error("sendVerificationEmail: 'to' is required");
  if (!url) throw new Error("sendVerificationEmail: 'url' is required");

  const client = getClient();
  const from = getFrom();

  const { data, error } = await client.emails.send({
    from,
    to,
    subject: "Verify your MultiUploads email",
    html: buildVerificationHtml({ name, url }),
    text: buildVerificationText({ name, url }),
  });

  if (error) {
    const message = error.message || "Resend API error";
    const err = new Error(`Failed to send verification email: ${message}`);
    err.cause = error;
    throw err;
  }

  return data;
}
