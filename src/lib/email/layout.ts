/**
 * Shared HTML email layout wrapper for all Krowned transactional emails.
 * Uses inline styles for maximum email client compatibility.
 */

const BRAND_PRIMARY = "#D9B36C";
const BRAND_DARK = "#0C0B0A";
const BRAND_CHARCOAL = "#1C1A17";
const BRAND_CREAM = "#F2E7D3";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";
const LOGO_URL = `${SITE_URL}/brand/logo-white.png`;

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
    ? `<p style="margin:8px 0 0;"><a href="${SITE_URL}/dashboard/settings" style="color:${BRAND_CREAM};text-decoration:underline;opacity:0.7;">Manage email preferences</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Krowned</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_DARK};padding:28px 32px;text-align:center;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Krowned" width="160" height="auto" style="display:inline-block;max-width:160px;height:auto;" />
              </a>
            </td>
          </tr>
          <!-- Gold accent line -->
          <tr>
            <td style="background:linear-gradient(90deg,${BRAND_PRIMARY},${BRAND_CHARCOAL});height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;color:${BRAND_DARK};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND_DARK};padding:24px 32px;text-align:center;font-size:12px;color:${BRAND_CREAM};">
              <p style="margin:0;opacity:0.7;">You received this email because you have an account on <a href="${SITE_URL}" style="color:${BRAND_PRIMARY};text-decoration:none;">Krowned</a>.</p>
              <p style="margin:8px 0 0;opacity:0.5;">&copy; ${new Date().getFullYear()} Krowned &middot; Your crown, booked.</p>
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
      <td style="background-color:${BRAND_DARK};border-radius:8px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:${BRAND_CREAM};font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">
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
    <td style="padding:6px 0;font-size:14px;font-weight:500;color:${BRAND_DARK};">${value}</td>
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
