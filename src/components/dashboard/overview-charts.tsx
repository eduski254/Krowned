"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const COLORS = [
  "#D9B36C", // Gold
  "#8A6A2F", // Bronze
  "#4A90A4", // Teal
  "#F2E7D3", // Cream
  "#1C1A17", // Charcoal
  "#7C6A4F", // Warm brown
];

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <ChartCard title={title}>
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data yet
      </p>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Signups Over Time (line chart, last 30 days)                       */
/* ------------------------------------------------------------------ */

export type SignupRow = { date: string; users: number; businesses: number };

export function SignupsChart({ data }: { data: SignupRow[] }) {
  if (data.length === 0) return <EmptyState title="Signups (Last 30 Days)" />;

  return (
    <ChartCard title="Signups (Last 30 Days)">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="users"
            name="Users"
            stroke="#D9B36C"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#D9B36C", stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="businesses"
            name="Businesses"
            stroke="#4A90A4"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#4A90A4", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Bookings Over Time (bar chart, last 30 days)                       */
/* ------------------------------------------------------------------ */

export type BookingDayRow = { date: string; count: number };

export function BookingsChart({ data }: { data: BookingDayRow[] }) {
  if (data.length === 0)
    return <EmptyState title="Bookings (Last 30 Days)" />;

  return (
    <ChartCard title="Bookings (Last 30 Days)">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Bar
            dataKey="count"
            name="Bookings"
            fill="#D9B36C"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Bookings by Category (donut chart)                                 */
/* ------------------------------------------------------------------ */

export type CategoryRow = { name: string; count: number };

export function CategoryChart({ data }: { data: CategoryRow[] }) {
  if (data.length === 0)
    return <EmptyState title="Bookings by Category" />;

  return (
    <ChartCard title="Bookings by Category">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            stroke="none"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${(name ?? "").length > 15 ? (name ?? "").slice(0, 12) + "..." : name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [v, "Bookings"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Cities (horizontal bar chart)                                  */
/* ------------------------------------------------------------------ */

export type CityRow = { city: string; count: number };

export function TopCitiesChart({ data }: { data: CityRow[] }) {
  if (data.length === 0)
    return <EmptyState title="Top Cities" />;

  return (
    <ChartCard title="Top Cities">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [v, "Businesses"]}
          />
          <Bar
            dataKey="count"
            fill="#8A6A2F"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Subscriptions by Plan (donut chart)                                */
/* ------------------------------------------------------------------ */

export type PlanRow = { plan: string; count: number };

export function SubscriptionsByPlanChart({ data }: { data: PlanRow[] }) {
  if (data.length === 0)
    return <EmptyState title="Subscriptions by Plan" />;

  const planColors: Record<string, string> = {
    Free: "#9CA3AF",
    Starter: "#D9B36C",
    Pro: "#8A6A2F",
    Enterprise: "#1C1A17",
  };

  return (
    <ChartCard title="Subscriptions by Plan">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="plan"
            stroke="none"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={planColors[d.plan] ?? COLORS[i % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [v, "Businesses"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Earning Businesses (horizontal bar chart)                      */
/* ------------------------------------------------------------------ */

export type TopBusinessRow = { name: string; revenue: number };

export function TopBusinessesChart({ data }: { data: TopBusinessRow[] }) {
  if (data.length === 0)
    return <EmptyState title="Top Businesses by GMV" />;

  return (
    <ChartCard title="Top Businesses by GMV">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
          />
          <Bar dataKey="revenue" fill="#D9B36C" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
