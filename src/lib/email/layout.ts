/**
 * Shared HTML email layout wrapper for all Krown transactional emails.
 * Uses inline styles for maximum email client compatibility.
 */

const BRAND_PRIMARY = "#D9B36C";
const BRAND_DARK = "#0C0B0A";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zawadibooking.vercel.app";

interface LayoutOptions {
  /** Show "Manage email preferences" link in footer (for optional emails) */
  showManagePrefs?: boolean;
}

export function emailLayout(
  body: string,
  preheader?: string,
  options?: LayoutOptions,
): string {
  const manageLink = options?.showManagePrefs
    ? `<p style="margin:8px 0 0;"><a href="${SITE_URL}/dashboard/settings" style="color:#6b7280;text-decoration:underline;">Manage email preferences</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Krown</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_PRIMARY};padding:24px 32px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">Krown</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:${BRAND_DARK};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e8e8ed;text-align:center;font-size:12px;color:#9ca3af;">
              <p style="margin:0;">You received this email because you have an account on Krown.</p>
              <p style="margin:8px 0 0;">&copy; ${new Date().getFullYear()} Krown. All rights reserved.</p>
              ${manageLink}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Inline-styled button for emails */
export function emailButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${BRAND_PRIMARY};border-radius:8px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Detail row for booking info tables in emails */
export function emailDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

/** Strip HTML tags for plaintext fallback */
export function htmlToPlaintext(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "-")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&copy;/g, "(c)")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
