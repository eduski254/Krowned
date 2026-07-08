export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "Home" },
  { label: "My Bookings", href: "/dashboard/bookings", icon: "Calendar" },
  { label: "Favorites", href: "/dashboard/favorites", icon: "Heart" },
  { label: "Reviews", href: "/dashboard/reviews", icon: "Star" },
  { label: "Payment Methods", href: "/dashboard/payments", icon: "CreditCard" },
  { label: "Profile", href: "/dashboard/profile", icon: "User" },
  { label: "Support", href: "/dashboard/support", icon: "LifeBuoy" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

export const businessNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/business", icon: "Home" },
  { label: "Calendar", href: "/dashboard/business/calendar", icon: "Calendar" },
  { label: "Services", href: "/dashboard/business/services", icon: "Scissors" },
  { label: "Staff", href: "/dashboard/business/staff", icon: "Users" },
  { label: "Clients", href: "/dashboard/business/clients", icon: "User" },
  { label: "Earnings", href: "/dashboard/business/earnings", icon: "DollarSign" },
  { label: "Reviews", href: "/dashboard/business/reviews", icon: "Star" },
  { label: "Business Profile", href: "/dashboard/business/profile", icon: "Building2" },
  { label: "Payments Setup", href: "/dashboard/business/payments", icon: "CreditCard" },
  { label: "Support", href: "/dashboard/support", icon: "LifeBuoy" },
  { label: "Settings", href: "/dashboard/business/settings", icon: "Settings" },
  { label: "My Profile", href: "/dashboard/profile", icon: "UserCircle" },
];

export const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/staff", icon: "Home" },
  { label: "My Schedule", href: "/dashboard/staff/schedule", icon: "Clock" },
  { label: "Appointments", href: "/dashboard/staff/appointments", icon: "Calendar" },
  { label: "Clients", href: "/dashboard/staff/clients", icon: "User" },
  { label: "Performance", href: "/dashboard/staff/performance", icon: "TrendingUp" },
  { label: "Earnings", href: "/dashboard/staff/earnings", icon: "DollarSign" },
  { label: "Profile", href: "/dashboard/staff/profile", icon: "User" },
  { label: "Support", href: "/dashboard/support", icon: "LifeBuoy" },
  { label: "My Profile", href: "/dashboard/profile", icon: "UserCircle" },
];

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: "LayoutGrid" },
  { label: "Businesses", href: "/dashboard/admin/businesses", icon: "Building2" },
  { label: "Users", href: "/dashboard/admin/users", icon: "Users" },
  { label: "Bookings", href: "/dashboard/admin/bookings", icon: "Calendar" },
  { label: "Categories", href: "/dashboard/admin/categories", icon: "Tag" },
  { label: "Reviews", href: "/dashboard/admin/reviews", icon: "Star" },
  { label: "Finance", href: "/dashboard/admin/finance", icon: "DollarSign" },
  { label: "Disputes", href: "/dashboard/admin/disputes", icon: "AlertTriangle" },
  { label: "Blog", href: "/dashboard/admin/blog", icon: "PenSquare" },
  { label: "Support Tickets", href: "/dashboard/admin/support", icon: "LifeBuoy" },
  { label: "Settings", href: "/dashboard/admin/settings", icon: "Settings" },
  { label: "My Profile", href: "/dashboard/profile", icon: "UserCircle" },
];
