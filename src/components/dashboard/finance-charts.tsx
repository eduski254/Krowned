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

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

export type PaymentRow = {
  amount: number;
  tip_amount: number;
  application_fee_amount: number;
  created_at: string;
};

function groupByMonth(rows: PaymentRow[]) {
  const map = new Map<
    string,
    { revenue: number; fees: number; tips: number; count: number }
  >();

  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = map.get(key) ?? { revenue: 0, fees: 0, tips: 0, count: 0 };
    map.set(key, {
      revenue: prev.revenue + (r.amount ?? 0),
      fees: prev.fees + (r.application_fee_amount ?? 0),
      tips: prev.tips + (r.tip_amount ?? 0),
      count: prev.count + 1,
    });
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: formatMonth(month),
      revenue: v.revenue / 100,
      fees: v.fees / 100,
      tips: v.tips / 100,
      count: v.count,
    }));
}

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

// Brand-aligned hardcoded colors (Recharts SVG needs resolved values)
const COLORS = {
  revenue: "#D9B36C",  // Gold
  fees: "#8A6A2F",     // Bronze
  tips: "#F2E7D3",     // Cream
  net: "#1C1A17",      // Charcoal
};

const PIE_COLORS = [
  "#D9B36C",  // Gold
  "#8A6A2F",  // Bronze
  "#F2E7D3",  // Cream
  "#1C1A17",  // Charcoal
];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function currencyFormatter(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/*  Admin Finance Charts                                               */
/* ------------------------------------------------------------------ */

export function AdminRevenueChart({ payments }: { payments: PaymentRow[] }) {
  const data = groupByMonth(payments);

  if (data.length === 0) {
    return (
      <ChartCard title="Revenue Over Time">
        <p className="py-8 text-center text-sm text-muted-foreground">No payment data yet</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Revenue Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={currencyFormatter} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`]}
          />
          <Legend iconType="circle" />
          <Bar dataKey="revenue" name="GMV" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
          <Bar dataKey="fees" name="Platform Fees" fill={COLORS.fees} radius={[4, 4, 0, 0]} />
          <Bar dataKey="tips" name="Tips" fill={COLORS.tips} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AdminBreakdownChart({ payments }: { payments: PaymentRow[] }) {
  const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0) / 100;
  const totalFees = payments.reduce((s, p) => s + (p.application_fee_amount ?? 0), 0) / 100;
  const totalTips = payments.reduce((s, p) => s + (p.tip_amount ?? 0), 0) / 100;
  const netToBusiness = totalRevenue - totalFees;

  const data = [
    { name: "Net to Business", value: Math.max(0, netToBusiness) },
    { name: "Platform Fees", value: totalFees },
    { name: "Tips (pass-through)", value: totalTips },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Revenue Breakdown">
        <p className="py-8 text-center text-sm text-muted-foreground">No payment data yet</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Revenue Breakdown">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AdminTransactionsChart({ payments }: { payments: PaymentRow[] }) {
  const data = groupByMonth(payments);

  if (data.length === 0) {
    return (
      <ChartCard title="Transaction Volume">
        <p className="py-8 text-center text-sm text-muted-foreground">No payment data yet</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Transaction Volume">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Transactions"
            stroke={COLORS.revenue}
            strokeWidth={2.5}
            dot={{ r: 5, fill: COLORS.revenue, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: COLORS.revenue, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Business Earnings Charts                                           */
/* ------------------------------------------------------------------ */

export function BusinessEarningsChart({ payments }: { payments: PaymentRow[] }) {
  const data = groupByMonth(payments).map((d) => ({
    ...d,
    net: d.revenue - d.fees,
  }));

  if (data.length === 0) {
    return (
      <ChartCard title="Earnings Over Time">
        <p className="py-8 text-center text-sm text-muted-foreground">No earnings data yet</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Earnings Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={currencyFormatter} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`]}
          />
          <Legend iconType="circle" />
          <Bar dataKey="net" name="Net Earnings" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
          <Bar dataKey="tips" name="Tips" fill={COLORS.tips} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BusinessBreakdownChart({ payments }: { payments: PaymentRow[] }) {
  const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0) / 100;
  const totalFees = payments.reduce((s, p) => s + (p.application_fee_amount ?? 0), 0) / 100;
  const totalTips = payments.reduce((s, p) => s + (p.tip_amount ?? 0), 0) / 100;
  const net = totalRevenue - totalFees;

  const data = [
    { name: "Your Earnings", value: Math.max(0, net) },
    { name: "Platform Fees", value: totalFees },
    { name: "Tips", value: totalTips },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Earnings Breakdown">
        <p className="py-8 text-center text-sm text-muted-foreground">No earnings data yet</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Earnings Breakdown">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(v) => [`$${Number(v).toFixed(2)}`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
