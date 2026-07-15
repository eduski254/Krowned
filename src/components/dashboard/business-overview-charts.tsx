"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  gold: "#D9B36C",
  bronze: "#8A6A2F",
  teal: "#4A90A4",
  cream: "#F2E7D3",
  charcoal: "#1C1A17",
  warmBrown: "#7C6A4F",
  muted: "#9CA3AF",
};

const PIE_COLORS = [
  COLORS.gold,
  COLORS.bronze,
  COLORS.teal,
  COLORS.warmBrown,
  COLORS.cream,
  COLORS.charcoal,
  COLORS.muted,
];

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Trend (area chart, monthly)                                */
/* ------------------------------------------------------------------ */

export type MonthlyRevenueRow = {
  month: string;
  revenue: number;
  bookings: number;
};

export function RevenueTrendChart({ data }: { data: MonthlyRevenueRow[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Revenue Trend">
        <p className="py-8 text-center text-sm text-muted-foreground">
          No revenue data yet
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Revenue Trend" subtitle="Monthly earnings over time">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              color: "var(--color-foreground, #000)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.gold}
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={{ r: 4, fill: COLORS.gold, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Bookings by Service (donut)                                        */
/* ------------------------------------------------------------------ */

export type ServiceBreakdownRow = { name: string; count: number };

export function ServiceBreakdownChart({
  data,
}: {
  data: ServiceBreakdownRow[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Popular Services">
        <p className="py-8 text-center text-sm text-muted-foreground">
          No booking data yet
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Popular Services" subtitle="Bookings by service type">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="count"
            stroke="none"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${(name ?? "").length > 14 ? (name ?? "").slice(0, 12) + "…" : (name ?? "")} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              color: "var(--color-foreground, #000)",
            }}
            formatter={(v) => [v, "Bookings"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Source (horizontal bar)                                     */
/* ------------------------------------------------------------------ */

export type SourceRow = { source: string; count: number };

const SOURCE_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  direct_link: "Direct Link",
  manual: "Manual",
};

const SOURCE_COLORS: Record<string, string> = {
  marketplace: COLORS.gold,
  direct_link: COLORS.teal,
  manual: COLORS.bronze,
};

export function BookingSourceChart({ data }: { data: SourceRow[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Booking Sources">
        <p className="py-8 text-center text-sm text-muted-foreground">
          No booking data yet
        </p>
      </ChartCard>
    );
  }

  const labeled = data.map((d) => ({
    ...d,
    label: SOURCE_LABELS[d.source] ?? d.source,
  }));

  return (
    <ChartCard
      title="Booking Sources"
      subtitle="Where your clients find you"
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={labeled} layout="vertical">
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.1}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              color: "var(--color-foreground, #000)",
            }}
            formatter={(v) => [v, "Bookings"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {labeled.map((d, i) => (
              <Cell
                key={i}
                fill={SOURCE_COLORS[d.source] ?? PIE_COLORS[i % PIE_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Weekly Bookings Trend (bar chart, last 8 weeks)                    */
/* ------------------------------------------------------------------ */

export type WeeklyBookingRow = { week: string; completed: number; cancelled: number };

export function WeeklyBookingsChart({ data }: { data: WeeklyBookingRow[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Weekly Bookings">
        <p className="py-8 text-center text-sm text-muted-foreground">
          No booking data yet
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Weekly Bookings" subtitle="Completed vs cancelled, last 8 weeks">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              color: "var(--color-foreground, #000)",
            }}
          />
          <Legend iconType="circle" />
          <Bar
            dataKey="completed"
            name="Completed"
            fill={COLORS.gold}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="cancelled"
            name="Cancelled"
            fill={COLORS.muted}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
