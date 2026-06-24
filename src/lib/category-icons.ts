import {
  Scissors,
  Sparkles,
  Palette,
  Droplet,
  Leaf,
  Heart,
  Home,
  Brush,
  Flower2,
  Sun,
  Moon,
  Star,
  Gem,
  Crown,
  Smile,
  Eye,
  Hand,
  Footprints,
  Baby,
  Dumbbell,
  Activity,
  Flame,
  Waves,
  TreePine,
  Mountain,
  Zap,
  Wind,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical map of allowed icon names → Lucide components.
 * Used by: homepage category cards, admin category icon picker,
 * and anywhere else that renders a category icon by name.
 *
 * To add a new icon option, add the import above and an entry here.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  palette: Palette,
  droplet: Droplet,
  leaf: Leaf,
  heart: Heart,
  home: Home,
  brush: Brush,
  flower2: Flower2,
  sun: Sun,
  moon: Moon,
  star: Star,
  gem: Gem,
  crown: Crown,
  smile: Smile,
  eye: Eye,
  hand: Hand,
  footprints: Footprints,
  baby: Baby,
  dumbbell: Dumbbell,
  activity: Activity,
  flame: Flame,
  waves: Waves,
  "tree-pine": TreePine,
  mountain: Mountain,
  zap: Zap,
  wind: Wind,
};

/** All available icon names (for picker UI) */
export const ICON_NAMES = Object.keys(CATEGORY_ICONS);
