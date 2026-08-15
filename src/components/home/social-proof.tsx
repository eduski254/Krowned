import {
  BadgeCheck,
  Lock,
  CalendarX,
  Tag,
  X,
  Check,
} from "lucide-react";

const BADGES = [
  { icon: BadgeCheck, label: "Every stylist ID-verified" },
  { icon: Lock, label: "Deposits held securely" },
  { icon: CalendarX, label: "Free cancellation up to 48hrs" },
  { icon: Tag, label: "Price locked at booking" },
];

const COMPARISONS = [
  { old: "Unread for days", new: "Confirmed in minutes" },
  { old: '"What\'s your price?"', new: "Price locked at booking" },
  { old: "No-shows, no recourse", new: "Deposit protected" },
  { old: "Screenshot the receipt", new: "Everything in one place" },
];

export function SocialProof() {
  return (
    <section className="bg-[#0C0B0A]" aria-labelledby="social-proof-heading">
      <h2 id="social-proof-heading" className="sr-only">
        Why clients and stylists trust Krowned
      </h2>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        {/* Badge Row */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2.5"
            >
              <badge.icon
                className="h-[18px] w-[18px] shrink-0 text-[#D9B36C]"
                aria-hidden="true"
              />
              <span className="text-[13px] font-medium text-[#F2E7D3]/85 sm:text-[14px]">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Hairline */}
        <div className="my-12 h-px bg-[#D9B36C]/15 sm:my-16" />

        {/* Comparison Strip */}
        <div>
          <p className="mb-8 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-[#D9B36C] sm:mb-10 sm:text-xs">
            The old way vs. Krowned
          </p>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {/* Column headers — desktop only */}
            <div className="hidden sm:block mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#F2E7D3]/40">
                Instagram DMs
              </span>
            </div>
            <div className="hidden sm:block mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#D9B36C]/70">
                Krowned
              </span>
            </div>

            {COMPARISONS.map((row) => (
              <ComparisonRow key={row.old} old={row.old} newText={row.new} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ old, newText }: { old: string; newText: string }) {
  return (
    <>
      {/* Old way */}
      <div className="flex items-center gap-3 rounded-xl bg-[#F2E7D3]/[0.03] px-4 py-3 sm:py-3.5">
        <X
          className="h-4 w-4 shrink-0 text-[#F2E7D3]/30"
          aria-hidden="true"
        />
        <span className="text-[13px] text-[#F2E7D3]/45 sm:text-sm">
          {old}
        </span>
      </div>
      {/* Krowned way */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#D9B36C]/15 bg-[#D9B36C]/[0.06] px-4 py-3 sm:mb-0 sm:py-3.5">
        <Check
          className="h-4 w-4 shrink-0 text-[#D9B36C]"
          aria-hidden="true"
        />
        <span className="text-[13px] font-medium text-[#F2E7D3]/90 sm:text-sm">
          {newText}
        </span>
      </div>
    </>
  );
}
