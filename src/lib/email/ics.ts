/**
 * Server-side .ics calendar file generation (RFC 5545).
 * Ported from the client-side implementation in booking-flow.tsx.
 * DST-safe via IANA TZID + Intl.DateTimeFormat.
 */

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toICSDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function toICSDateLocal(date: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

export interface ICSEventInput {
  title: string;
  start: Date;
  end: Date;
  timezone: string;
  location?: string;
  description?: string;
}

/**
 * Generate a VCALENDAR .ics string (not a Blob — suitable for email attachment).
 */
export function generateICSString(input: ICSEventInput): string {
  const { title, start, end, timezone, location, description } = input;
  const uid = `${start.getTime()}-${Math.random().toString(36).slice(2)}@zawadi.com`;
  const localStart = toICSDateLocal(start, timezone);
  const localEnd = toICSDateLocal(end, timezone);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Krowned//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${timezone}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    `TZNAME:${timezone}`,
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `DTSTART;TZID=${timezone}:${localStart}`,
    `DTEND;TZID=${timezone}:${localEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    `UID:${uid}`,
    `DTSTAMP:${toICSDateUTC(new Date())}`,
  ];
  if (location) lines.push(`LOCATION:${escapeICS(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeICS(description)}`);
  lines.push(`X-WR-TIMEZONE:${timezone}`);
  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
