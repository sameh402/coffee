import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  addDays,
  eachDayOfInterval,
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

function noise(y: number, m: number, d: number, k = 1) {
  const s = y * 1_000_000 + (m + 1) * 10_000 + d * 100 + k * 7;
  const x = Math.sin(s) * 43758.5453;
  return x - Math.floor(x);
}

const AGE_GROUPS = [
  "15-20",
  "20-25",
  "25-30",
  "30-35",
  "35-40",
  "40+",
] as const;
const PRODUCTS = [
  "Spanish Latte",
  "Americano",
  "Iced Caramel",
  "Croissant",
  "Espresso",
  "Mocha",
] as const;

type AgeGroup = (typeof AGE_GROUPS)[number];

type FeedbackType = "Quality" | "Service" | "Delivery" | "Price" | "Other";

type Feedback = {
  id: string;
  name: string;
  phone: string;
  type: FeedbackType;
  description: string;
  createdAt: string;
};

type Scale = "yearly" | "quarterly" | "monthly" | "weekly" | "daily";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function CustomerService() {
  const now = new Date();

  // Global filters
  const [scale, setScale] = useState<Scale>("monthly");
  const [year, setYear] = useState<number>(getYear(now));
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(
    (Math.floor(getMonth(now) / 3) + 1) as 1 | 2 | 3 | 4,
  );
  const [month, setMonth] = useState<number>(getMonth(now) + 1); // 1..12
  const [week, setWeek] = useState<number>(1); // 0 = All weeks
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">(
    "All",
  );
  const [ageFilter, setAgeFilter] = useState<AgeGroup | "All">("All");

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
    const start = (quarter - 1) * 3 + 1;
    const end = start + 2;
    return monthsAll.filter((m) => m.value >= start && m.value <= end);
  }, [monthsAll, quarter]);

  const effectiveMonth = useMemo(() => {
    const start = (quarter - 1) * 3 + 1;
    const end = start + 2;
    return clamp(month, start, end);
  }, [month, quarter]);

  function currentRange(): { start: Date; end: Date; label: string } {
    if (scale === "yearly") {
      const s = startOfYear(new Date(year, 0, 1));
      return { start: s, end: endOfYear(s), label: String(year) };
    }
    if (scale === "quarterly") {
      const m0 = (quarter - 1) * 3;
      const s = startOfMonth(new Date(year, m0, 1));
      return {
        start: s,
        end: endOfMonth(new Date(year, m0 + 2, 1)),
        label: `Q${quarter} ${year}`,
      };
    }
    if (scale === "monthly") {
      const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
      return { start: s, end: endOfMonth(s), label: format(s, "MMM yyyy") };
    }
    if (scale === "weekly") {
      if (week === 0) {
        const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
        const e = endOfMonth(s);
        return { start: s, end: e, label: `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}` };
      }
      const base = startOfWeek(
        startOfMonth(new Date(year, effectiveMonth - 1, 1)),
        { weekStartsOn: 1 },
      );
      const s = addDays(base, (week - 1) * 7);
      return {
        start: s,
        end: addDays(s, 6),
        label: `${format(s, "MMM d")} – ${format(addDays(s, 6), "MMM d, yyyy")}`,
      };
    }
    // daily
    if (week === 0) {
      const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
      return { start: s, end: s, label: format(s, "MMM yyyy") };
    }
    const base = startOfWeek(
      startOfMonth(new Date(year, effectiveMonth - 1, 1)),
      { weekStartsOn: 1 },
    );
    const s = addDays(base, (week - 1) * 7);
    return { start: s, end: s, label: format(s, "EEE, MMM d yyyy") };
  }

  function previousRangeOf(r: { start: Date; end: Date }) {
    const days = Math.max(
      1,
      Math.floor((r.end.getTime() - r.start.getTime()) / 86400000) + 1,
    );
    const prevEnd = addDays(r.start, -1);
    const prevStart = addDays(prevEnd, -days + 1);
    return { start: prevStart, end: prevEnd };
  }

  const range = useMemo(
    () => currentRange(),
    [scale, year, quarter, effectiveMonth, week],
  );
  const prevRange = useMemo(() => previousRangeOf(range), [range]);

  function segmentWeight(g: "Male" | "Female", ageIdx: number) {
    const gMul = g === "Male" ? 1.04 : 0.98;
    const aMul = 0.9 + ageIdx * 0.05;
    return gMul * aMul;
  }
  function dailyNewFor(date: Date, g: "Male" | "Female", ageIdx: number) {
    const base = 18 + ageIdx * 6;
    const n =
      base +
      noise(getYear(date), getMonth(date), getDate(date), 3 + ageIdx) * 22;
    return Math.max(0, Math.round(n * segmentWeight(g, ageIdx)));
  }
  function retentionBaseFor(g: "Male" | "Female", ageIdx: number, date: Date) {
    const b =
      0.55 +
      (g === "Male" ? 0.03 : 0.02) +
      Math.min(0.12, ageIdx * 0.015) +
      (noise(getYear(date), getMonth(date), getDate(date), 19 + ageIdx) - 0.5) *
        0.08;
    return clamp(b, 0.38, 0.92);
  }

  function iterateDays(s: Date, e: Date) {
    return eachDayOfInterval({ start: s, end: e });
  }

  // Aggregations under global filters
  const filteredGroups = useMemo(() => {
    const genders = (
      genderFilter === "All" ? ["Male", "Female"] : [genderFilter]
    ) as ("Male" | "Female")[];
    const ages = ageFilter === "All" ? AGE_GROUPS : [ageFilter];
    return { genders, ages };
  }, [genderFilter, ageFilter]);

  function sumNewInRange(r: { start: Date; end: Date }) {
    const days = iterateDays(r.start, r.end);
    let total = 0;
    filteredGroups.genders.forEach((g) => {
      filteredGroups.ages.forEach((ag) => {
        const idx = AGE_GROUPS.indexOf(ag);
        days.forEach((d) => {
          total += dailyNewFor(d, g, idx);
        });
      });
    });
    return total;
  }

  const newCurrent = useMemo(
    () => sumNewInRange(range),
    [range, filteredGroups],
  );
  const newPrev = useMemo(
    () => sumNewInRange(prevRange),
    [prevRange, filteredGroups],
  );
  const delta = newCurrent - newPrev;
  const pct = newPrev > 0 ? (delta / newPrev) * 100 : 0;

  const genderBreakdown = useMemo(() => {
    const days = iterateDays(range.start, range.end);
    const by: Record<"Male" | "Female", number> = { Male: 0, Female: 0 };
    (["Male", "Female"] as const).forEach((g) => {
      if (genderFilter !== "All" && g !== genderFilter) return;
      const ages = ageFilter === "All" ? AGE_GROUPS : [ageFilter];
      ages.forEach((ag) => {
        const idx = AGE_GROUPS.indexOf(ag);
        days.forEach((d) => {
          by[g] += dailyNewFor(d, g, idx);
        });
      });
    });
    return by;
  }, [range, genderFilter, ageFilter]);

  const ageGroupNewData = useMemo(() => {
    const days = iterateDays(range.start, range.end);
    return AGE_GROUPS.map((ag, idx) => {
      if (ageFilter !== "All" && ageFilter !== ag)
        return { group: ag, customers: 0 };
      let total = 0;
      (["Male", "Female"] as const).forEach((g) => {
        if (genderFilter !== "All" && g !== genderFilter) return;
        days.forEach((d) => {
          total += dailyNewFor(d, g, idx);
        });
      });
      return { group: ag, customers: total };
    });
  }, [range, genderFilter, ageFilter]);

  // Product ranking: score proportional to segment traffic
  const productRankData = useMemo(() => {
    const segIntensity = Math.max(
      1,
      newCurrent /
        Math.max(
          1,
          (range.end.getTime() - range.start.getTime()) / 86400000 + 1,
        ),
    );
    return PRODUCTS.map((p, idx) => {
      const base = 50 + idx * 12;
      const s =
        base +
        segIntensity * 0.8 +
        (noise(year, effectiveMonth - 1, week + idx, 7) - 0.5) * 30;
      return { product: p, Score: Math.round(clamp(s, 10, 200)) };
    });
  }, [newCurrent, range, year, effectiveMonth, week]);

  // Satisfaction data by age & gender selector
  const satisfactionData = useMemo(() => {
    return AGE_GROUPS.map((ag, idx) => {
      if (ageFilter !== "All" && ageFilter !== ag)
        return { group: ag, Male: 0, Female: 0 };
      const male = Math.round(
        clamp(
          72 +
            idx * 2 +
            (noise(year, effectiveMonth - 1, idx + 5, 11) - 0.5) * 12,
          40,
          98,
        ),
      );
      const female = Math.round(
        clamp(
          74 +
            idx * 1.8 +
            (noise(year, effectiveMonth - 1, idx + 8, 13) - 0.5) * 12,
          40,
          98,
        ),
      );
      return { group: ag, Male: male, Female: female };
    });
  }, [year, effectiveMonth, ageFilter]);

  // Retention
  const retentionMale = useMemo(() => {
    const days = iterateDays(range.start, range.end);
    const ages = ageFilter === "All" ? AGE_GROUPS : [ageFilter];
    const prevDays = iterateDays(prevRange.start, prevRange.end);
    let prevActive = 0,
      baseRate = 0;
    ages.forEach((ag) => {
      const idx = AGE_GROUPS.indexOf(ag);
      prevDays.forEach((d) => {
        prevActive += dailyNewFor(d, "Male", idx);
        baseRate += retentionBaseFor("Male", idx, d);
      });
    });
    baseRate = baseRate / Math.max(1, ages.length * prevDays.length);
    const growth = newPrev > 0 ? newCurrent / newPrev : 1;
    const rate = clamp(baseRate * 100 + (growth - 1) * 12, 35, 95);
    return Math.round(rate);
  }, [range, prevRange, ageFilter, newCurrent, newPrev]);

  const retentionFemale = useMemo(() => {
    const days = iterateDays(range.start, range.end);
    const ages = ageFilter === "All" ? AGE_GROUPS : [ageFilter];
    const prevDays = iterateDays(prevRange.start, prevRange.end);
    let prevActive = 0,
      baseRate = 0;
    ages.forEach((ag) => {
      const idx = AGE_GROUPS.indexOf(ag);
      prevDays.forEach((d) => {
        prevActive += dailyNewFor(d, "Female", idx);
        baseRate += retentionBaseFor("Female", idx, d);
      });
    });
    baseRate = baseRate / Math.max(1, ages.length * prevDays.length);
    const growth = newPrev > 0 ? newCurrent / newPrev : 1;
    const rate = clamp(baseRate * 100 + (growth - 1) * 10, 35, 95);
    return Math.round(rate);
  }, [range, prevRange, ageFilter, newCurrent, newPrev]);

  const retentionByAge = useMemo(() => {
    return AGE_GROUPS.map((ag, idx) => {
      if (ageFilter !== "All" && ag !== ageFilter)
        return { group: ag, Male: 0, Female: 0 };
      const baseM = retentionBaseFor("Male", idx, range.start);
      const baseF = retentionBaseFor("Female", idx, range.start);
      const adjM = clamp(
        baseM * 100 + (noise(year, effectiveMonth - 1, idx + 21, 17) - 0.5) * 8,
        35,
        95,
      );
      const adjF = clamp(
        baseF * 100 + (noise(year, effectiveMonth - 1, idx + 31, 19) - 0.5) * 8,
        35,
        95,
      );
      return { group: ag, Male: Math.round(adjM), Female: Math.round(adjF) };
    });
  }, [range, year, effectiveMonth, ageFilter]);

  // Feedback data (static list) filtered by range
  const feedbacks: Feedback[] = useMemo(
    () => [
      {
        id: "1",
        name: "Ahmed Samir",
        phone: "+20 100 123 4567",
        type: "Service",
        description: "Long waiting time at counter.",
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      },
      {
        id: "2",
        name: "Sara Ali",
        phone: "+971 50 555 7788",
        type: "Quality",
        description: "Coffee tasted burnt.",
        createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      },
      {
        id: "3",
        name: "Mohamed Hassan",
        phone: "+966 55 331 2244",
        type: "Delivery",
        description: "Order arrived late and cold.",
        createdAt: new Date(now.getTime() - 16 * 86400000).toISOString(),
      },
      {
        id: "4",
        name: "Laila Omar",
        phone: "+20 112 987 6543",
        type: "Price",
        description: "Price higher than menu.",
        createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
      },
      {
        id: "5",
        name: "John Smith",
        phone: "+1 917 555 1000",
        type: "Other",
        description: "Music too loud.",
        createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      },
      {
        id: "6",
        name: "Mary Jane",
        phone: "+44 7700 900123",
        type: "Quality",
        description: "Croissant not fresh.",
        createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
      },
      {
        id: "7",
        name: "Omar Farouk",
        phone: "+20 109 222 6789",
        type: "Service",
        description: "Rude response on phone.",
        createdAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
      },
      {
        id: "8",
        name: "Fatima Noor",
        phone: "+971 52 333 4444",
        type: "Delivery",
        description: "Wrong items delivered.",
        createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
      },
    ],
    [now],
  );

  function inRange(iso: string, r: { start: Date; end: Date }) {
    const t = new Date(iso).getTime();
    return t >= r.start.getTime() && t <= addDays(r.end, 1).getTime();
  }

  const [typeFilter, setTypeFilter] = useState<FeedbackType | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | "Low" | "Medium" | "High" | "Critical"
  >("All");
  const [query, setQuery] = useState("");

  function priorityFromAging(daysOpen: number) {
    if (daysOpen >= 14) return { label: "Critical", color: "bg-rose-600" };
    if (daysOpen >= 7) return { label: "High", color: "bg-orange-600" };
    if (daysOpen >= 3) return { label: "Medium", color: "bg-amber-600" };
    return { label: "Low", color: "bg-emerald-600" };
  }
  function daysBetween(a: Date, b: Date) {
    return Math.max(0, Math.floor((a.getTime() - b.getTime()) / 86400000));
  }

  const filteredFeedbacks = useMemo(() => {
    const today = new Date();
    return feedbacks
      .filter((f) => inRange(f.createdAt, range))
      .map((f) => {
        const daysOpen = daysBetween(today, new Date(f.createdAt));
        const p = priorityFromAging(daysOpen);
        return {
          ...f,
          daysOpen,
          priority: p.label,
          priorityColor: p.color,
        } as const;
      })
      .filter((f) => (typeFilter === "All" ? true : f.type === typeFilter))
      .filter((f) =>
        priorityFilter === "All" ? true : f.priority === priorityFilter,
      )
      .filter((f) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          f.name.toLowerCase().includes(q) ||
          f.phone.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.daysOpen - a.daysOpen);
  }, [feedbacks, range, typeFilter, priorityFilter, query]);

  // Demand map points dynamic-ish by period
  const demandPoints = useMemo(() => {
    const seedY = year,
      seedM = effectiveMonth - 1,
      seedW = week;
    const pts = [
      { city: "Cairo", lat: 30.0444, lon: 31.2357 },
      { city: "Riyadh", lat: 24.7136, lon: 46.6753 },
      { city: "Dubai", lat: 25.2048, lon: 55.2708 },
      { city: "London", lat: 51.5074, lon: -0.1278 },
      { city: "New York", lat: 40.7128, lon: -74.006 },
    ] as const;
    return pts.map((p, i) => {
      const d = Math.round(
        clamp(
          50 +
            (noise(seedY, seedM, seedW + i, 41) - 0.5) * 50 +
            (genderFilter === "Male" ? 6 : genderFilter === "Female" ? -4 : 0),
          10,
          99,
        ),
      );
      return { ...p, demand: d };
    });
  }, [year, effectiveMonth, week, genderFilter]);

  function project(lat: number, lon: number, w: number, h: number) {
    const x = ((lon + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    return { x, y };
  }

  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);

  return (
    <DashboardLayout title="Customer Satisfaction Dashboard">
      {/* Global filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={scale} onValueChange={(v) => setScale(v as Scale)}>
          <TabsList>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(quarter)}
            onValueChange={(v) => setQuarter(Number(v) as any)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="w-[120px]">
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
          <Select
            value={String(week)}
            onValueChange={(v) => setWeek(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
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
            value={genderFilter}
            onValueChange={(v) => setGenderFilter(v as any)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ageFilter}
            onValueChange={(v) => setAgeFilter(v as any)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {AGE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>New Customers</CardTitle>
            <CardDescription>{range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {newCurrent.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              vs previous period{" "}
              {pct >= 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <TrendingUp className="size-4" />
                  {pct.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700">
                  <TrendingDown className="size-4" />
                  {Math.abs(pct).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Breakdown</CardTitle>
            <CardDescription>Filtered by global slicers</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Male</div>
              <div className="text-2xl font-semibold">
                {genderBreakdown.Male}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Female</div>
              <div className="text-2xl font-semibold">
                {genderBreakdown.Female}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention</CardTitle>
            <CardDescription>By gender</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Male</div>
              <div className="text-2xl font-semibold">{retentionMale}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Female</div>
              <div className="text-2xl font-semibold">{retentionFemale}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age groups & product ranks */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>New Customers by Age Group</CardTitle>
            <CardDescription>Distribution in {range.label}</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroupNewData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis dataKey="group" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ReTooltip />
                <Bar
                  dataKey="customers"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Rank</CardTitle>
            <CardDescription>Higher is better · sorted</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...productRankData].sort((a,b)=>b.Score-a.Score)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="product" stroke="hsl(var(--muted-foreground))" width={120} />
                <ReTooltip />
                <Bar dataKey="Score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction & retention by age */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>By gender and age</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis dataKey="group" stroke="hsl(var(--muted-foreground))" />
                <YAxis unit="%" stroke="hsl(var(--muted-foreground))" />
                <ReTooltip />
                <Legend />
                {genderFilter !== "Female" && (
                  <Bar
                    dataKey="Male"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {genderFilter !== "Male" && (
                  <Bar
                    dataKey="Female"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention by Age Group</CardTitle>
            <CardDescription>Percentage retained</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionByAge}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                />
                <XAxis dataKey="group" stroke="hsl(var(--muted-foreground))" />
                <YAxis unit="%" stroke="hsl(var(--muted-foreground))" />
                <ReTooltip />
                <Legend />
                {genderFilter !== "Female" && (
                  <Bar dataKey="Male" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                )}
                {genderFilter !== "Male" && (
                  <Bar dataKey="Female" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Demand by location (bar chart) */}
      <div className="grid gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Demand by Location</CardTitle>
            <CardDescription>Relative demand per city</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="city" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ReTooltip />
                <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Negative feedback table */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Negative Feedback</CardTitle>
            <CardDescription>
              Sorted by time unresolved · {range.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-2 mb-3">
              <Input
                placeholder="Search name, phone, description"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="md:w-80"
              />
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Price">Price</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Days Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.phone}</TableCell>
                    <TableCell>{f.type}</TableCell>
                    <TableCell
                      className="max-w-[320px] truncate"
                      title={f.description}
                    >
                      {f.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={(f as any).priorityColor}>
                        {(f as any).priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(f as any).daysOpen}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                {filteredFeedbacks.length} item(s) matched
              </TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>Full context for the selected row</DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {selectedFeedback.name}</div>
              <div><span className="text-muted-foreground">Phone:</span> {selectedFeedback.phone}</div>
              <div><span className="text-muted-foreground">Type:</span> {selectedFeedback.type}</div>
              <div><span className="text-muted-foreground">Created:</span> {format(new Date(selectedFeedback.createdAt), "PPpp")}</div>
              <div>
                <div className="text-muted-foreground">Short Description</div>
                <div>{String(selectedFeedback.description).slice(0, 80)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Long Description</div>
                <div>{selectedFeedback.description}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
