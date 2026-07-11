import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { bookingReminderEmail } from "@/lib/email/templates";

/**
 * Cron endpoint: sends 24-hour booking reminder emails.
 *
 * Finds confirmed bookings starting in the next 23–25 hour window
 * that haven't had a reminder sent yet, sends the email, and marks them.
 *
 * Intended to run every 15–60 minutes via Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header to prevent unauthorized triggers.
 *
 * GET /api/cron/reminders
 */
export async function GET(request: Request) {
  // Verify cron secret (skip in dev if not set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60_000); // 23h from now
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60_000); // 25h from now

  // Find confirmed bookings in the 23-25h window that haven't been reminded
  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      `id, client_id, contact_id, starts_at, ends_at,
       services(name, duration_minutes),
       staff(display_name),
       businesses(name, timezone, address, city, owner_id),
       profiles!client_id(full_name),
       business_contacts!contact_id(name, email)`,
    )
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .limit(100);

  if (error) {
    console.error("[cron/reminders] Query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, message: "No reminders to send" });
  }

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      // Resolve client email + name
      let clientEmail: string | undefined;
      let clientName = "there";

      if (booking.client_id) {
        const {
          data: { user },
        } = await admin.auth.admin.getUserById(booking.client_id);
        clientEmail = user?.email;
        clientName = (booking.profiles as any)?.full_name ?? "there";
      } else if (booking.contact_id) {
        const contact = booking.business_contacts as any;
        clientEmail = contact?.email;
        clientName = contact?.name ?? "there";
      }

      if (!clientEmail) {
        // No email to send to — mark as sent to avoid retrying
        await admin
          .from("bookings")
          .update({ reminder_24h_sent: true })
          .eq("id", booking.id);
        continue;
      }

      const businessData = booking.businesses as any;
      const timezone = businessData?.timezone ?? "Africa/Nairobi";
      const address = [businessData?.address, businessData?.city]
        .filter(Boolean)
        .join(", ");

      const mail = bookingReminderEmail({
        clientName,
        bookingId: booking.id,
        serviceName: (booking.services as any)?.name ?? "Service",
        businessName: businessData?.name ?? "Business",
        staffName: (booking.staff as any)?.display_name ?? "Your professional",
        startsAt: new Date(booking.starts_at),
        durationMinutes: (booking.services as any)?.duration_minutes ?? 60,
        timezone,
        address: address || undefined,
      });

      const success = await sendEmail({
        to: clientEmail,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      // Mark as sent regardless of email delivery (to avoid spam on retry)
      await admin
        .from("bookings")
        .update({ reminder_24h_sent: true })
        .eq("id", booking.id);

      if (success) {
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[cron/reminders] Error processing booking ${booking.id}:`, err);
      failed++;
    }
  }

  console.log(`[cron/reminders] Done: ${sent} sent, ${failed} failed, ${bookings.length} total`);
  return NextResponse.json({ sent, failed, total: bookings.length });
}
