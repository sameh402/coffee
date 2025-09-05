import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Smile, Frown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  addDays,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getDate,
  getMonth,
  getYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

// Deterministic synthetic data generator with seeded variability
function seededNoise(y: number, m: number, d: number, h: number) {
  const s = y * 1_000_000 + (m + 1) * 10_000 + d * 100 + h;
  const x = Math.sin(s) * 43758.5453;
  return x - Math.floor(x);
}

function metricsFor(date: Date) {
  const dow = date.getDay();
  const hour = date.getHours();
  const baseDay =
    800 + (dow === 6 ? 700 : dow === 5 ? 450 : dow === 0 ? -150 : 0);
  const rushMorning = hour >= 7 && hour < 11 ? 320 : 0;
  const rushEvening = hour >= 16 && hour < 19 ? 420 : 0;
  const seasonal = (getMonth(date) % 4) * 70;
  const noise =
    (seededNoise(getYear(date), getMonth(date), getDate(date), hour) - 0.5) *
    180;
  const revenue = baseDay / 24 + rushMorning + rushEvening + seasonal + noise;
  const profit =
    10 +
    (dow % 4) * 2 +
    (rushMorning ? 3 : 0) +
    (rushEvening ? 2 : 0) +
    seededNoise(getYear(date), getMonth(date), getDate(date), hour);
  return {
    revenue: Math.max(30, Math.round(revenue)),
    profit: Math.round(profit * 10) / 10,
  };
}

function sumRevenue(data: { revenue: number }[]) {
  return data.reduce((a, b) => a + b.revenue, 0);
}

export default function Overview() {
  const now = new Date();
  const [scale, setScale] = useState<
    "yearly" | "quarterly" | "monthly" | "weekly" | "hourly"
  >("weekly");
  const [year, setYear] = useState<number | "all">(getYear(now));
  const [quarter, setQuarter] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [month, setMonth] = useState<number>(getMonth(now) + 1); // 1-12
  const [week, setWeek] = useState<number>(1); // 1-5
  const intervals = [
    { label: "09–12", start: 9, end: 12 },
    { label: "12–15", start: 12, end: 15 },
    { label: "15–18", start: 15, end: 18 },
    { label: "18–21", start: 18, end: 21 },
    { label: "21–24", start: 21, end: 24 },
  ] as const;
  const [intervalIdx, setIntervalIdx] = useState(0);

  const years = useMemo(() => {
    const cy = getYear(now);
    return Array.from({ length: 6 }, (_, i) => cy - 5 + i);
  }, [now]);

  const monthsAll = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: format(new Date(2000, i, 1), "MMM"),
      })),
    [],
  );

  const monthsToShow = useMemo(() => {
    if (quarter === "all") return monthsAll;
    const start = (quarter - 1) * 3 + 1;
    const end = start + 2;
    return monthsAll.filter((m) => m.value >= start && m.value <= end);
  }, [monthsAll, quarter]);

  const effectiveMonth = useMemo(() => {
    if (quarter === "all") return month;
    const start = (quarter - 1) * 3 + 1;
    const end = start + 2;
    return Math.min(Math.max(month, start), end);
  }, [month, quarter]);

  const currentMonthLabel = format(
    new Date(
      typeof year === "number" ? year : getYear(now),
      effectiveMonth - 1,
      1,
    ),
    "MMM yyyy",
  );

  // Build dataset based on selections
  const data = useMemo(() => {
    if (scale === "yearly") {
      const y = typeof year === "number" ? year : getYear(now);
      const start = startOfYear(new Date(y, 0, 1));
      const arr = eachMonthOfInterval({ start, end: endOfYear(start) });
      return arr.map((m) => {
        const mm = metricsFor(new Date(getYear(m), getMonth(m), 10, 12));
        return {
          label: format(m, "MMM"),
          revenue: mm.revenue * 30,
          profit: 12 + (getMonth(m) % 4) * 1.5,
        };
      });
    }

    if (scale === "quarterly") {
      const makeQuarterValue = (y: number, q: 1 | 2 | 3 | 4) => {
        const d = new Date(y, (q - 1) * 3 + 1, 10, 12);
        const m = metricsFor(d);
        return {
          label: `${y} Q${q}`,
          revenue: m.revenue * 90,
          profit: 14 + q * 1.2,
        };
      };

      if (year === "all") {
        const rows: { label: string; revenue: number; profit: number }[] = [];
        years.forEach((yy) => {
          ([1 as const, 2, 3, 4] as const)
            .filter((q) => (quarter === "all" ? true : q === quarter))
            .forEach((q) => rows.push(makeQuarterValue(yy, q)));
        });
        return rows;
      }
      if (quarter === "all") {
        return ([1 as const, 2, 3, 4] as const).map((q) =>
          makeQuarterValue(year, q),
        );
      }
      return [makeQuarterValue(year, quarter)];
    }

    if (scale === "monthly") {
      const y = typeof year === "number" ? year : getYear(now);
      const start = startOfMonth(new Date(y, effectiveMonth - 1, 1));
      const days = eachDayOfInterval({ start, end: endOfMonth(start) });
      return days.map((d) => ({
        label: format(d, "d"),
        ...metricsFor(new Date(getYear(d), getMonth(d), getDate(d), 12)),
      }));
    }

    if (scale === "weekly") {
      const y = typeof year === "number" ? year : getYear(now);
      const mStart = startOfMonth(new Date(y, effectiveMonth - 1, 1));
      const base = startOfWeek(mStart, { weekStartsOn: 1 });
      if (week === 0) {
        const monthDays = eachDayOfInterval({ start: mStart, end: endOfMonth(mStart) });
        const arr = [1, 2, 3, 4].map((w) => ({ label: `Wk ${w}`, revenue: 0, profit: 0 }));
        const counts = [0, 0, 0, 0];
        monthDays.forEach((d) => {
          const diffDays = Math.floor((d.getTime() - base.getTime()) / 86400000);
          const wk = Math.floor(diffDays / 7) + 1;
          const idx = Math.min(Math.max(wk, 1), 4) - 1;
          const m = metricsFor(new Date(getYear(d), getMonth(d), getDate(d), 12));
          arr[idx].revenue += m.revenue;
          arr[idx].profit += m.profit;
          counts[idx] += 1;
        });
        return arr.map((b, i) => ({
          label: b.label,
          revenue: b.revenue,
          profit: counts[i] ? Math.round((b.profit / counts[i]) * 10) / 10 : 0,
        }));
      }
      const start = addDays(base, (week - 1) * 7);
      const days = eachDayOfInterval({ start, end: addDays(start, 6) });
      return days.map((d) => ({
        label: format(d, "EEE"),
        ...metricsFor(new Date(getYear(d), getMonth(d), getDate(d), 12)),
      }));
    }

    // hourly with interval
    const y = typeof year === "number" ? year : getYear(now);
    const wk = week === 0 ? 1 : week;
    const date = new Date(y, effectiveMonth - 1, 1 + (wk - 1) * 7);
    const hours = eachHourOfInterval({
      start: date,
      end: addDays(date, 1),
    }).slice(0, 24);
    const { start, end } = intervals[intervalIdx];
    return hours
      .filter((d) => {
        const h = d.getHours();
        return h >= start && h < end;
      })
      .map((d) => ({ label: format(d, "HH:mm"), ...metricsFor(d) }));
  }, [
    scale,
    year,
    quarter,
    month,
    week,
    intervalIdx,
    years,
    now,
    effectiveMonth,
    intervals,
  ]);

  const totalRevenue = useMemo(() => sumRevenue(data as any), [data]);
  const avgProfit = useMemo(
    () =>
      (data as any).reduce((a: number, b: any) => a + b.profit, 0) /
      (data as any).length,
    [data],
  );

  const status: {
    label: "Profitable" | "Saturated" | "Loss";
    color: string;
    icon: JSX.Element;
  } = useMemo(() => {
    if (avgProfit >= 18)
      return {
        label: "Profitable",
        color: "text-emerald-700",
        icon: <TrendingUp className="size-5" />,
      };
    if (avgProfit >= 14)
      return {
        label: "Saturated",
        color: "text-amber-700",
        icon: <TrendingUp className="size-5" />,
      };
    return {
      label: "Loss",
      color: "text-rose-700",
      icon: <TrendingDown className="size-5" />,
    };
  }, [avgProfit]);

  // Dynamic feedback derived from selection & data trend
  const positiveRate = useMemo(() => {
    const arr = data as any[];
    if (!arr.length) return 50;
    const first = arr[0]?.revenue ?? 0;
    const last = arr[arr.length - 1]?.revenue ?? 0;
    const growth = first > 0 ? (last - first) / first : 0;
    const base = 72 + Math.tanh(growth) * 10 + (avgProfit - 14) * 2; // bounded influence from trend and margin
    return Math.min(98, Math.max(5, Math.round(base)));
  }, [data, avgProfit]);
  const negativeRate = 100 - positiveRate;

  const itemsLow = 8;
  const needsStockAction = itemsLow > 0;

  return (
    <DashboardLayout title="Overview">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={scale} onValueChange={(v) => setScale(v as any)}>
          <TabsList>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total Revenue</span>
          <Badge variant="secondary">${totalRevenue.toLocaleString()}</Badge>
          <span className="ml-2">Avg Profit %</span>
          <Badge variant="secondary">{avgProfit.toFixed(1)}%</Badge>
        </div>
      </div>

      {/* selectors */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(quarter)}
          onValueChange={(v) =>
            setQuarter(v === "all" ? "all" : (Number(v) as any))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(effectiveMonth)}
          onValueChange={(v) => setMonth(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {monthsToShow.map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All</SelectItem>
            {[1, 2, 3, 4].map((w) => (
              <SelectItem key={w} value={String(w)}>{`Wk ${w}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(intervalIdx)}
          onValueChange={(v) => setIntervalIdx(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            {intervals.map((iv, i) => (
              <SelectItem key={iv.label} value={String(i)}>
                {iv.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              {scale === "monthly"
                ? currentMonthLabel
                : `${scale[0].toUpperCase() + scale.slice(1)} trend`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data as any}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ReTooltip cursor={{ stroke: "hsl(var(--muted))" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Status</CardTitle>
            <CardDescription>Quick health check</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div
              className={`flex items-center gap-2 text-xl font-semibold ${status.color}`}
            >
              {status.icon}
              {status.label}
            </div>
            <Button asChild className="w-full">
              <a href="/finance">Go to Finance</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Profitability</CardTitle>
            <CardDescription>Average margin by {scale}</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data as any}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  unit="%"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ReTooltip cursor={{ stroke: "hsl(var(--muted))" }} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(var(--coffee))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
            <CardDescription>Low items: 8</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div
              className={`text-sm font-medium ${needsStockAction ? "text-amber-700" : "text-emerald-700"}`}
            >
              {needsStockAction ? "Action Needed" : "All Good"}
            </div>
            <Button
              asChild
              variant={needsStockAction ? "default" : "secondary"}
            >
              <a href="/stock">Go to Stock</a>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="size-5 text-emerald-600" /> Positive Feedback
              </CardTitle>
              <CardDescription>
                {positiveRate}% positive reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold text-emerald-700">
                {positiveRate}%
              </div>
              <Button asChild variant="secondary">
                <a href="/customer-service">Customer Service</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Frown className="size-5 text-rose-600" /> Negative Feedback
              </CardTitle>
              <CardDescription>
                {negativeRate}% negative reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold text-rose-700">
                {negativeRate}%
              </div>
              <Button asChild variant="secondary">
                <a href="/customer-service">Customer Service</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
