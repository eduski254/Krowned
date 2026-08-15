// Krowned brand tokens — keep in sync with web globals.css
export const colors = {
  // Brand
  gold: "#D9B36C",
  goldLight: "#E4C783",
  goldDark: "#C6A15B",
  cream: "#F2E7D3",

  // Neutrals
  black: "#0C0B0A",
  darkBg: "#1C1A17",
  white: "#FAFAFA",

  // Semantic
  primary: "#D9B36C",
  primaryForeground: "#0C0B0A",

  // UI
  card: "#FFFFFF",
  cardDark: "#1C1A17",
  border: "#E5E5E5",
  borderDark: "#2A2725",
  muted: "#F5F5F5",
  mutedDark: "#1F1D1A",
  mutedForeground: "#737373",

  // Status
  success: "#16A34A",
  error: "#DC2626",
  warning: "#F59E0B",
} as const;

export const fonts = {
  heading: "TanMeringue",
  body: "Montserrat",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
