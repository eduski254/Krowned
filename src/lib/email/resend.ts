import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Krowned <noreply@krowned.app>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Plaintext fallback */
  text?: string;
  /** Optional .ics calendar attachment */
  attachments?: { filename: string; content: string }[];
}

/**
 * Send an email via Resend. Fire-and-forget: logs errors but never throws.
 * A failed email must NOT break the underlying action.
 * Returns false silently if RESEND_API_KEY is not configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("[email] RESEND_API_KEY not set — skipping email");
      return false;
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "utf-8"),
      })),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
