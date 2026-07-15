import { emailLayout, emailButton, htmlToPlaintext } from "./layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";
const CAN_SPAM_FOOTER_ADDRESS = "Krowned \u00b7 9480 Main St #1035, Fairfax, VA 22031";

/** Day offsets from nurture_started_at for each step (0-indexed). */
export const NURTURE_SCHEDULE_DAYS = [0, 3, 7, 11, 16, 21, 27, 33, 39, 45] as const;

export interface NurtureEmailOutput {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

interface MergeTags {
  name?: string | null;
  business_name?: string | null;
  source?: string | null;
  lead_id: string;
  email: string;
}

function n(val: string | null | undefined, fallback: string): string {
  return val?.trim() || fallback;
}

function signupUrl(step: number): string {
  return `${SITE_URL}/signup?utm_source=nurture&utm_medium=email&utm_campaign=drip&utm_content=email${step + 1}`;
}

function unsubUrl(leadId: string, email: string): string {
  return `${SITE_URL}/unsubscribe?id=${encodeURIComponent(leadId)}&email=${encodeURIComponent(email)}`;
}

function nurtureFooter(tags: MergeTags): string {
  const biz = n(tags.business_name, "Your business");
  const src = n(tags.source, "an online directory");
  const unsub = unsubUrl(tags.lead_id, tags.email);
  return `
    <tr>
      <td style="background-color:#0C0B0A;padding:24px 32px;text-align:center;font-size:12px;color:#F2E7D3;">
        <p style="margin:0;opacity:0.7;">${biz} &middot; You're receiving this because we found your business on ${src}.</p>
        <p style="margin:8px 0 0;opacity:0.5;">${CAN_SPAM_FOOTER_ADDRESS}</p>
        <p style="margin:8px 0 0;">
          <a href="${unsub}" style="color:#D9B36C;text-decoration:underline;opacity:0.7;">Unsubscribe</a>
          <span style="opacity:0.4;"> &mdash; one click, no hard feelings.</span>
        </p>
      </td>
    </tr>`;
}

/**
 * Wrap nurture email body in brand layout but swap the default footer
 * for the CAN-SPAM compliant nurture footer.
 */
function nurtureLayout(body: string, preheader: string, tags: MergeTags): string {
  const base = emailLayout(body, preheader);
  // Replace the default footer with nurture-specific footer
  const footerStart = base.lastIndexOf("<!-- Footer -->");
  if (footerStart === -1) {
    // fallback: replace the last <tr> containing the footer
    const lastTr = base.lastIndexOf("<td style=\"background-color:#0C0B0A;padding:24px 32px;text-align:center;font-size:12px;");
    if (lastTr === -1) return base;
    const trStart = base.lastIndexOf("<tr>", lastTr);
    const trEnd = base.indexOf("</tr>", lastTr) + 5;
    return base.slice(0, trStart) + nurtureFooter(tags) + base.slice(trEnd);
  }
  const trEnd = base.indexOf("</tr>", footerStart) + 5;
  return base.slice(0, footerStart) + nurtureFooter(tags) + base.slice(trEnd);
}

type TemplateBuilder = (tags: MergeTags) => NurtureEmailOutput;

const templates: TemplateBuilder[] = [
  // ── Email 1 — Day 0 — Sales ──────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const biz = n(tags.business_name, "your business");
    const cta = signupUrl(0);
    const subject = "Your chair, booked.";
    const preheader = "The booking platform built for textured-hair pros.";
    const body = `
      <p>Hey ${name},</p>
      <p>Booking braids, locs, or a fresh cut shouldn't live in your DMs &mdash; the "you still available?" texts, the CashApp deposits, the ghosting.</p>
      <p><strong>Krowned</strong> is a booking platform built for one thing: textured-hair pros in the DMV. Clients find you, see your real openings, and book &mdash; while you keep a real calendar, take deposits, and cut the no-shows.</p>
      <p>Listing ${biz} is free, and setup takes about 10 minutes.</p>
      ${emailButton("List your studio free \u2192", cta)}
      <p style="color:#6b7280;">&mdash; The Krowned team</p>`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 2 — Day 3 — Sales ──────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(1);
    const subject = "Stop running your books in your DMs";
    const preheader = "There's a better way than screenshots and CashApp.";
    const body = `
      <p>${name}, quick question &mdash; how many bookings slipped through your DMs this month? A buried message, a client who forgot, a deposit that never came.</p>
      <p>Stylists on Krowned run it differently: one link in your bio, clients book real time slots, deposits handled up front, reminders sent automatically. No back-and-forth, no chasing.</p>
      <p>And you keep 100% of your service price &mdash; Krowned isn't a cut of your money, it's a system for your business.</p>
      ${emailButton("See how it works \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 3 — Day 7 — Sales ──────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const biz = n(tags.business_name, "your business");
    const cta = signupUrl(2);
    const subject = "10 minutes to set up. Free to start.";
    const preheader = "No commitment, no card, no catch.";
    const body = `
      <p>${name}, the #1 thing we hear from busy stylists: "I don't have time to set up another app." Fair. So we made it quick:</p>
      <ol style="padding-left:20px;color:#0C0B0A;">
        <li><strong>Add your services + prices</strong> &mdash; 5 min</li>
        <li><strong>Set your hours</strong> &mdash; 2 min</li>
        <li><strong>Share your booking link</strong> &mdash; 30 sec</li>
      </ol>
      <p>That's it &mdash; ${biz} is live and bookable. Free to start, no card required. Add deposits, staff, and more whenever you're ready.</p>
      ${emailButton("Get set up \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 4 — Day 11 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(3);
    const subject = "5 booking mistakes that cost stylists money";
    const preheader = "#2 is the one almost everyone makes.";
    const body = `
      <p>${name}, after talking with a lot of independent stylists, the same money-leaks keep coming up:</p>
      <ol style="padding-left:20px;color:#0C0B0A;">
        <li><strong>Booking in DMs</strong> &mdash; messages get buried, slots go unfilled.</li>
        <li><strong>No deposits</strong> &mdash; a no-show costs you a whole appointment.</li>
        <li><strong>No cancellation policy</strong> &mdash; last-minute drops with no cushion.</li>
        <li><strong>No reminders</strong> &mdash; clients forget, you sit empty.</li>
        <li><strong>Undercharging</strong> &mdash; pricing on vibes instead of your time + skill.</li>
      </ol>
      <p>Krowned handles 1&ndash;4 out of the box (we'll tackle #5 in a few days).</p>
      ${emailButton("Plug the leaks \u2014 list free \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 5 — Day 16 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(4);
    const subject = "What your retwist should actually cost";
    const preheader = "Price your work with confidence.";
    const body = `
      <p>${name}, "I'm not sure what to charge" quietly costs textured-hair pros real money. A simple formula for any service:</p>
      <p style="background:#f9f5ee;padding:16px;border-radius:8px;border-left:3px solid #D9B36C;font-style:italic;">
        (your hourly rate &times; time it takes) + product cost + your experience premium.
      </p>
      <p>If a retwist takes 2 hours and your time is worth $60/hr, you're at $120+ before product &mdash; not the $75 you might quote out of habit. Charge for the skill, not just the hours.</p>
      <p>On Krowned you set per-service prices and deposits, so clients see your value up front.</p>
      ${emailButton("Set your prices \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 6 — Day 21 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(5);
    const subject = "What booked-out DMV stylists do differently";
    const preheader = "It's not luck \u2014 it's a system.";
    const body = `
      <p>${name}, the stylists who stay booked around here tend to share four habits:</p>
      <ol style="padding-left:20px;color:#0C0B0A;">
        <li>They <strong>take deposits</strong> &mdash; fewer no-shows, more committed clients.</li>
        <li>They keep <strong>one booking link everywhere</strong> &mdash; bio, Google, business card.</li>
        <li>They <strong>show real availability</strong> so clients book instantly instead of asking.</li>
        <li>They <strong>collect reviews</strong> after every appointment.</li>
      </ol>
      <p>None of it takes more hours &mdash; just a better setup. Krowned gives you all four.</p>
      ${emailButton("Build your setup free \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 7 — Day 27 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(6);
    const subject = "5 things fully-booked stylists never skip";
    const preheader = "Steal the playbook.";
    const body = `
      <p>${name}, five moves that keep a chair full:</p>
      <ol style="padding-left:20px;color:#0C0B0A;">
        <li>A <strong>deposit</strong> on every booking.</li>
        <li>A clear <strong>cancellation window</strong> (24&ndash;48 hrs).</li>
        <li><strong>Automatic reminders</strong> the day before.</li>
        <li>A <strong>rebooking prompt</strong> before the client leaves.</li>
        <li>A <strong>review request</strong> the next morning.</li>
      </ol>
      <p>Do these five consistently and your calendar starts taking care of itself. Krowned automates most of them for you.</p>
      ${emailButton("Put it on autopilot \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 8 — Day 33 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(7);
    const subject = "How to kill no-shows for good";
    const preheader = "Two settings. That's it.";
    const body = `
      <p>${name}, no-shows are the quiet killer &mdash; an empty chair you can't get back. The fix is two things working together:</p>
      <ol style="padding-left:20px;color:#0C0B0A;">
        <li><strong>A deposit at booking</strong> &mdash; clients who pay, show.</li>
        <li><strong>Automatic reminders</strong> &mdash; clients who are reminded, show.</li>
      </ol>
      <p>Turn both on and no-shows drop hard. Krowned does both automatically &mdash; you don't lift a finger.</p>
      ${emailButton("Stop the no-shows \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 9 — Day 39 — Value ─────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const cta = signupUrl(8);
    const subject = "Get 5 stars after every appointment";
    const preheader = "Reviews are your next client's decision.";
    const body = `
      <p>${name}, new clients trust other clients. A steady stream of 5-star reviews is the difference between "maybe" and "booked."</p>
      <p>The trick is timing &mdash; ask right after the appointment, when they love their hair most, and make it one tap. Krowned sends the review request for you at the perfect moment and shows those reviews on your profile, so new clients book with confidence.</p>
      ${emailButton("Grow your reviews \u2192", cta)}`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },

  // ── Email 10 — Day 45 — Close ────────────────────────────────────
  (tags) => {
    const name = n(tags.name, "there");
    const biz = n(tags.business_name, "your business");
    const cta = signupUrl(9);
    const subject = "Last one from us \ud83d\udc51";
    const preheader = "No hard feelings \u2014 the door stays open.";
    const body = `
      <p>${name}, this is the last email in our intro series &mdash; we won't keep filling your inbox.</p>
      <p>The short version: <strong>Krowned</strong> helps textured-hair pros in the DMV get booked without living in their DMs &mdash; real calendar, deposits, reminders, reviews, and clients who actually find you. Free to start, ~10 minutes to set up, and you keep every dollar of your service price.</p>
      <p>If it's ever the right time, ${biz} has a spot waiting.</p>
      ${emailButton("List your studio free \u2192", cta)}
      <p style="color:#6b7280;">Whatever you use, we hope your chair stays full.</p>
      <p style="color:#6b7280;">&mdash; The Krowned team</p>`;
    const html = nurtureLayout(body, preheader, tags);
    return { subject, preheader, html, text: htmlToPlaintext(html) };
  },
];

/** Get the nurture email for a given step (0-indexed). Returns null if step out of range. */
export function getNurtureEmail(step: number, tags: MergeTags): NurtureEmailOutput | null {
  const builder = templates[step];
  if (!builder) return null;
  return builder(tags);
}

/** Total number of nurture steps */
export const NURTURE_TOTAL_STEPS = templates.length;

/** Compute the next send date for a given step from the nurture start date. */
export function nextSendDate(nurtureStartedAt: Date, step: number): Date {
  const days = NURTURE_SCHEDULE_DAYS[step];
  if (days === undefined) return new Date(8640000000000000); // far future
  const d = new Date(nurtureStartedAt);
  d.setDate(d.getDate() + days);
  return d;
}

/** Compute the effective daily cap accounting for warm-up ramp. */
export function effectiveDailyCap(baseCap: number, warmupStartDate: Date | null): number {
  if (!warmupStartDate) return baseCap;
  const daysSinceStart = Math.floor((Date.now() - warmupStartDate.getTime()) / 86400000);
  if (daysSinceStart < 0) return 0;
  // Ramp: 10 → 20 → 40 → baseCap over ~2 weeks
  const ramp = [10, 10, 20, 20, 20, 30, 30, 40, 40, 50, 50, 60, 60, 70];
  const rampCap = daysSinceStart < ramp.length ? ramp[daysSinceStart] : baseCap;
  return Math.min(rampCap, baseCap);
}
