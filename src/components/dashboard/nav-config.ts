export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

// --- Client ---
export const clientNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "Home" },
      { label: "My Bookings", href: "/dashboard/bookings", icon: "Calendar" },
      { label: "Favorites", href: "/dashboard/favorites", icon: "Heart" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Reviews", href: "/dashboard/reviews", icon: "Star" },
      { label: "Payment Methods", href: "/dashboard/payments", icon: "CreditCard" },
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
];

// --- Business Owner ---
export const businessNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard/business", icon: "Home" },
      { label: "Calendar", href: "/dashboard/business/calendar", icon: "Calendar" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Services", href: "/dashboard/business/services", icon: "Scissors" },
      { label: "Staff", href: "/dashboard/business/staff", icon: "Users" },
      { label: "Clients", href: "/dashboard/business/clients", icon: "User" },
      { label: "Business Profile", href: "/dashboard/business/profile", icon: "Building2" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Earnings", href: "/dashboard/business/earnings", icon: "DollarSign" },
      { label: "Reviews", href: "/dashboard/business/reviews", icon: "Star" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Billing & Payments", href: "/dashboard/business/settings", icon: "CreditCard" },
    ],
  },
];

// --- Staff ---
export const staffNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard/staff", icon: "Home" },
      { label: "My Schedule", href: "/dashboard/staff/schedule", icon: "Clock" },
      { label: "Appointments", href: "/dashboard/staff/appointments", icon: "Calendar" },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Clients", href: "/dashboard/staff/clients", icon: "User" },
      { label: "Performance", href: "/dashboard/staff/performance", icon: "TrendingUp" },
      { label: "Earnings", href: "/dashboard/staff/earnings", icon: "DollarSign" },
    ],
  },
];

// --- Super Admin ---
export const adminNav: NavGroup[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard/admin", icon: "LayoutGrid" },
      { label: "Businesses", href: "/dashboard/admin/businesses", icon: "Building2" },
      { label: "Users", href: "/dashboard/admin/users", icon: "Users" },
      { label: "Bookings", href: "/dashboard/admin/bookings", icon: "Calendar" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Categories", href: "/dashboard/admin/categories", icon: "Tag" },
      { label: "Reviews", href: "/dashboard/admin/reviews", icon: "Star" },
      { label: "Finance", href: "/dashboard/admin/finance", icon: "DollarSign" },
      { label: "Disputes", href: "/dashboard/admin/disputes", icon: "AlertTriangle" },
      { label: "Blog", href: "/dashboard/admin/blog", icon: "PenSquare" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Leads", href: "/dashboard/admin/leads", icon: "UserPlus" },
      { label: "Support Tickets", href: "/dashboard/admin/support", icon: "LifeBuoy" },
      { label: "Settings", href: "/dashboard/admin/settings", icon: "Settings" },
    ],
  },
];

/** Flatten groups into a flat NavItem[] for components that need it */
export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}
