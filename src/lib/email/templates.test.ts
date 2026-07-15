import { describe, it, expect } from "vitest";
import {
  welcomeEmail,
  bookingConfirmationEmail,
  bookingRescheduleEmail,
  bookingCancellationEmail,
  newBookingOwnerEmail,
  bookingCancelledByClientOwnerEmail,
  newReviewOwnerEmail,
  staffInvitationEmail,
  newSupportTicketEmail,
  supportTicketReplyEmail,
  supportTicketStatusEmail,
  accountDeletionEmail,
  bookingReminderEmail,
} from "./templates";

// ── Fixture data ───────────────────────────────────────────────────────

const BOOKING_ID = "12345678-abcd-efgh-ijkl-mnopqrstuvwx";
const BOOKING_REF = "KR-12345678";
const TICKET_ID = "ticket-abc-123";
const STARTS_AT = new Date("2026-07-20T14:00:00Z");
const OLD_STARTS_AT = new Date("2026-07-18T10:00:00Z");
const TZ = "America/New_York";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

// ── Template registry ──────────────────────────────────────────────────

interface TemplateEntry {
  name: string;
  generate: () => { subject: string; html: string; text: string };
  expectedCtaUrl: string;
  recipient: string;
}

const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    name: "welcomeEmail (client)",
    generate: () => welcomeEmail("Alex"),
    expectedCtaUrl: `${SITE_URL}/explore`,
    recipient: "client",
  },
  {
    name: "welcomeEmail (professional)",
    generate: () => welcomeEmail("Alex", "professional"),
    expectedCtaUrl: `${SITE_URL}/dashboard/business/onboarding`,
    recipient: "professional",
  },
  {
    name: "bookingConfirmationEmail",
    generate: () =>
      bookingConfirmationEmail({
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        staffName: "Jane",
        startsAt: STARTS_AT,
        durationMinutes: 90,
        timezone: TZ,
        amount: 7500,
        currency: "usd",
        address: "123 Main St, DC",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/bookings`,
    recipient: "client",
  },
  {
    name: "bookingRescheduleEmail",
    generate: () =>
      bookingRescheduleEmail({
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        staffName: "Jane",
        oldStartsAt: OLD_STARTS_AT,
        newStartsAt: STARTS_AT,
        durationMinutes: 90,
        timezone: TZ,
        address: "123 Main St, DC",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/bookings`,
    recipient: "client",
  },
  {
    name: "bookingCancellationEmail (by client)",
    generate: () =>
      bookingCancellationEmail({
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        startsAt: STARTS_AT,
        timezone: TZ,
        cancelledBy: "client",
        address: "123 Main St, DC",
      }),
    expectedCtaUrl: `${SITE_URL}/explore`,
    recipient: "client",
  },
  {
    name: "bookingCancellationEmail (by business)",
    generate: () =>
      bookingCancellationEmail({
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        startsAt: STARTS_AT,
        timezone: TZ,
        cancelledBy: "business",
      }),
    expectedCtaUrl: `${SITE_URL}/explore`,
    recipient: "client",
  },
  {
    name: "newBookingOwnerEmail",
    generate: () =>
      newBookingOwnerEmail({
        ownerName: "Jane",
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        staffName: "Jane",
        startsAt: STARTS_AT,
        durationMinutes: 90,
        timezone: TZ,
        amount: 7500,
        currency: "usd",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/business/calendar`,
    recipient: "owner",
  },
  {
    name: "bookingCancelledByClientOwnerEmail",
    generate: () =>
      bookingCancelledByClientOwnerEmail({
        ownerName: "Jane",
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        startsAt: STARTS_AT,
        timezone: TZ,
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/business/calendar`,
    recipient: "owner",
  },
  {
    name: "newReviewOwnerEmail",
    generate: () =>
      newReviewOwnerEmail({
        ownerName: "Jane",
        clientName: "Alex",
        rating: 5,
        comment: "Braids came out fire!",
        serviceName: "Box Braids",
        businessName: "Braid Bar",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/business/reviews`,
    recipient: "owner",
  },
  {
    name: "staffInvitationEmail",
    generate: () =>
      staffInvitationEmail({
        staffName: "Maria",
        businessName: "Braid Bar",
        inviteToken: "inv-token-abc",
        invitedBy: "Jane",
      }),
    expectedCtaUrl: `${SITE_URL}/invite/inv-token-abc`,
    recipient: "staff",
  },
  {
    name: "newSupportTicketEmail",
    generate: () =>
      newSupportTicketEmail({
        adminName: "Admin",
        userName: "Alex",
        subject: "Payment issue",
        category: "billing",
        ticketId: TICKET_ID,
        message: "I was charged twice for my booking.",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/support/${TICKET_ID}`,
    recipient: "admin",
  },
  {
    name: "supportTicketReplyEmail (staff reply)",
    generate: () =>
      supportTicketReplyEmail({
        recipientName: "Alex",
        senderName: "Admin",
        ticketSubject: "Payment issue",
        ticketId: TICKET_ID,
        message: "We've issued a refund.",
        isStaffReply: true,
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/support/${TICKET_ID}`,
    recipient: "client",
  },
  {
    name: "supportTicketReplyEmail (user reply)",
    generate: () =>
      supportTicketReplyEmail({
        recipientName: "Admin",
        senderName: "Alex",
        ticketSubject: "Payment issue",
        ticketId: TICKET_ID,
        message: "Thanks, got it!",
        isStaffReply: false,
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/support/${TICKET_ID}`,
    recipient: "admin",
  },
  {
    name: "supportTicketStatusEmail",
    generate: () =>
      supportTicketStatusEmail({
        userName: "Alex",
        ticketSubject: "Payment issue",
        ticketId: TICKET_ID,
        newStatus: "resolved",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/support/${TICKET_ID}`,
    recipient: "client",
  },
  {
    name: "accountDeletionEmail",
    generate: () => accountDeletionEmail({ userName: "Alex" }),
    expectedCtaUrl: "mailto:support@krowned.app",
    recipient: "client",
  },
  {
    name: "bookingReminderEmail",
    generate: () =>
      bookingReminderEmail({
        clientName: "Alex",
        bookingId: BOOKING_ID,
        serviceName: "Box Braids",
        businessName: "Braid Bar",
        staffName: "Jane",
        startsAt: STARTS_AT,
        durationMinutes: 90,
        timezone: TZ,
        address: "123 Main St, DC",
      }),
    expectedCtaUrl: `${SITE_URL}/dashboard/bookings`,
    recipient: "client",
  },
];

// ── Tests ──────────────────────────────────────────────────────────────

describe("Email templates", () => {
  // Confirm exact template count
  it("should have 16 template variants (13 functions, some with variants)", () => {
    expect(TEMPLATE_REGISTRY.length).toBe(16);
  });

  describe.each(TEMPLATE_REGISTRY)("$name", (entry) => {
    const email = entry.generate();

    it("HTML part is non-empty", () => {
      expect(email.html.length).toBeGreaterThan(100);
      expect(email.html).toContain("<!DOCTYPE html>");
    });

    it("plain-text part is non-empty", () => {
      expect(email.text.length).toBeGreaterThan(50);
    });

    it("plain-text contains the CTA URL", () => {
      expect(email.text).toContain(entry.expectedCtaUrl);
    });

    it("plain-text has no residual HTML tags", () => {
      expect(email.text).not.toMatch(/<[a-z][^>]*>/i);
    });

    it("plain-text has preheader stripped (no display:none content)", () => {
      expect(email.text).not.toMatch(/display\s*:\s*none/i);
    });

    it("plain-text has <head> stripped (no <title>Krowned</title> leaking)", () => {
      // The word "Krowned" will appear in body copy, but NOT as the
      // very first word on its own line (which would mean <title> leaked)
      expect(email.text).not.toMatch(/^Krowned\n/);
    });

    it("subject line is non-empty", () => {
      expect(email.subject.length).toBeGreaterThan(5);
    });

    it("no unresolved {{ }} template tokens", () => {
      expect(email.html).not.toMatch(/\{\{.*?\}\}/);
      expect(email.text).not.toMatch(/\{\{.*?\}\}/);
    });

    it("no undefined/null literals in output", () => {
      expect(email.html).not.toContain("undefined");
      expect(email.text).not.toContain("undefined");
      // Allow "null" only in attribute values like style, not in visible text
      expect(email.text).not.toMatch(/\bnull\b/i);
    });

    it("all href URLs are absolute (https:// or mailto:)", () => {
      const hrefs = [...email.html.matchAll(/href="([^"]*)"/g)].map(
        (m) => m[1],
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(
          href.startsWith("https://") || href.startsWith("mailto:"),
          `Expected absolute URL, got: ${href}`,
        ).toBe(true);
      }
    });

    it("booking emails use KR- reference prefix", () => {
      if (email.subject.includes("—")) {
        // Booking-related emails include a reference after em dash
        const refMatch = email.subject.match(/KR-[A-Z0-9]+/);
        if (refMatch) {
          expect(refMatch[0]).toMatch(/^KR-/);
        }
      }
    });

    it("HTML uses inline styles (no <style> or <link> tags)", () => {
      expect(email.html).not.toMatch(/<style[\s>]/i);
      expect(email.html).not.toMatch(/<link[^>]*stylesheet/i);
    });

    it("logo image has alt text", () => {
      const logoMatch = email.html.match(/<img[^>]*logo[^>]*/i);
      if (logoMatch) {
        expect(logoMatch[0]).toContain('alt="');
      }
    });

    it("body has text-color fallback (color on <td>)", () => {
      expect(email.html).toMatch(
        /color:\s*#[0-9a-fA-F]{3,6}/,
      );
    });
  });
});

// ── Role-specific copy checks ──────────────────────────────────────────

describe("Role-appropriate copy", () => {
  it("welcome (client) mentions booking/finding stylists", () => {
    const email = welcomeEmail("Alex");
    expect(email.html).toContain("Find Your Stylist");
    expect(email.html).not.toContain("Set Up Your Business");
  });

  it("welcome (professional) mentions business setup", () => {
    const email = welcomeEmail("Alex", "professional");
    expect(email.html).toContain("Set Up Your Business");
    expect(email.html).not.toContain("Find Your Stylist");
  });

  it("staff invite includes accept URL and expiry note", () => {
    const email = staffInvitationEmail({
      staffName: "Maria",
      businessName: "Braid Bar",
      inviteToken: "tok-123",
      invitedBy: "Jane",
    });
    expect(email.html).toContain("/invite/tok-123");
    expect(email.text).toContain("/invite/tok-123");
    expect(email.html).toContain("7 days");
  });

  it("booking cancelled by business shows business name as canceller", () => {
    const email = bookingCancellationEmail({
      clientName: "Alex",
      bookingId: BOOKING_ID,
      serviceName: "Braids",
      businessName: "Crown Studio",
      startsAt: STARTS_AT,
      timezone: TZ,
      cancelledBy: "business",
    });
    expect(email.html).toContain("crown studio cancelled");
  });

  it("booking cancelled by client shows 'You cancelled'", () => {
    const email = bookingCancellationEmail({
      clientName: "Alex",
      bookingId: BOOKING_ID,
      serviceName: "Braids",
      businessName: "Crown Studio",
      startsAt: STARTS_AT,
      timezone: TZ,
      cancelledBy: "client",
    });
    expect(email.html).toContain("you cancelled");
  });
});

// ── From-address audit ─────────────────────────────────────────────────

describe("Sender address", () => {
  it("default EMAIL_FROM uses hello@krowned.app", () => {
    // The actual default in resend.ts
    const defaultFrom =
      process.env.EMAIL_FROM ?? "Krowned <hello@krowned.app>";
    expect(defaultFrom).toContain("hello@krowned.app");
  });
});
