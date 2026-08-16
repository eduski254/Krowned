export type BadgeCategory = "identity" | "accessibility" | "service" | "trust" | "specialty";

export type BadgeConfig = {
  id: string;
  label: string;
  category: BadgeCategory;
  emoji: string;
};

export const BADGE_CATEGORIES: Record<BadgeCategory, string> = {
  identity: "Identity & Ownership",
  accessibility: "Accessibility & Comfort",
  service: "Service Style",
  trust: "Trust & Quality",
  specialty: "Specialties",
};

export const BADGES: BadgeConfig[] = [
  // Identity & Ownership
  { id: "women-owned", label: "Women-Owned", category: "identity", emoji: "\u{1F469}\u{200D}\u{1F4BC}" },
  { id: "black-owned", label: "Black-Owned", category: "identity", emoji: "\u270A\u{1F3FF}" },
  { id: "latino-owned", label: "Latina/o-Owned", category: "identity", emoji: "\u{1F1F2}\u{1F1FD}" },
  { id: "veteran-owned", label: "Veteran-Owned", category: "identity", emoji: "\u{1FA96}" },
  { id: "lgbtq-friendly", label: "LGBTQ+ Friendly", category: "identity", emoji: "\u{1F3F3}\uFE0F\u200D\u{1F308}" },

  // Accessibility & Comfort
  { id: "wheelchair-accessible", label: "Wheelchair Accessible", category: "accessibility", emoji: "\u267F" },
  { id: "kid-friendly", label: "Kid-Friendly", category: "accessibility", emoji: "\u{1F476}" },
  { id: "pet-friendly", label: "Pet-Friendly", category: "accessibility", emoji: "\u{1F43E}" },
  { id: "gender-neutral", label: "Gender-Neutral", category: "accessibility", emoji: "\u{1F9D1}" },
  { id: "sensory-friendly", label: "Sensory-Friendly", category: "accessibility", emoji: "\u{1F49C}" },

  // Service Style
  { id: "walk-ins-welcome", label: "Walk-Ins Welcome", category: "service", emoji: "\u{1F6B6}" },
  { id: "appointment-only", label: "By Appointment Only", category: "service", emoji: "\u{1F4C5}" },
  { id: "mobile-service", label: "Mobile / At-Home", category: "service", emoji: "\u{1F697}" },
  { id: "late-night", label: "Late-Night Hours", category: "service", emoji: "\u{1F319}" },
  { id: "same-day", label: "Same-Day Bookings", category: "service", emoji: "\u26A1" },

  // Trust & Quality
  { id: "licensed-insured", label: "Licensed & Insured", category: "trust", emoji: "\u{1F4DC}" },
  { id: "natural-products", label: "Natural Products", category: "trust", emoji: "\u{1F33F}" },
  { id: "vegan-products", label: "Vegan Products", category: "trust", emoji: "\u{1F331}" },
  { id: "bilingual", label: "Bilingual Staff", category: "trust", emoji: "\u{1F5E3}\uFE0F" },
  { id: "parking", label: "Parking Available", category: "trust", emoji: "\u{1F17F}\uFE0F" },

  // Specialties
  { id: "4c-specialist", label: "4C Hair Specialist", category: "specialty", emoji: "\u{1F451}" },
  { id: "texture-expert", label: "Texture Expert", category: "specialty", emoji: "\u2728" },
  { id: "bridal", label: "Bridal Services", category: "specialty", emoji: "\u{1F492}" },
  { id: "men-welcome", label: "Men Welcome", category: "specialty", emoji: "\u{1F64B}\u200D\u2642\uFE0F" },
];

export const MAX_BADGES = 6;

export function getBadgeById(id: string): BadgeConfig | undefined {
  return BADGES.find((b) => b.id === id);
}

export function getBadgesByIds(ids: string[]): BadgeConfig[] {
  return ids.map((id) => getBadgeById(id)).filter(Boolean) as BadgeConfig[];
}
