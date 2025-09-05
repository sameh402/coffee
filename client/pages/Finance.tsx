import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
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

// Types
type Scale = "yearly" | "quarterly" | "monthly" | "weekly" | "daily";

type Entry = {
  id: string;
  date: string; // ISO date (yyyy-MM-dd)
  amount: number;
  note: string;
};

type CostSectionProps = {
  title: string;
  storageKey: string;
  description: string;
};

function useLocalEntries(storageKey: string, seed: Entry[]) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seed;
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {}
  }, [entries, storageKey]);
  return { entries, setEntries } as const;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function CostSection({ title, storageKey, description }: CostSectionProps) {
  const now = new Date();
  const [scale, setScale] = useState<Scale>("monthly");
  const [year, setYear] = useState<number>(getYear(now));
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(
    (Math.floor(getMonth(now) / 3) + 1) as 1 | 2 | 3 | 4,
  );
  const [month, setMonth] = useState<number>(getMonth(now) + 1);
  const [week, setWeek] = useState<number>(1);

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

  // Seeded demo entries
  const seed: Entry[] = useMemo(() => {
    const arr: Entry[] = [];
    years.forEach((yy) => {
      const months = eachMonthOfInterval({
        start: startOfYear(new Date(yy, 0, 1)),
        end: endOfYear(new Date(yy, 0, 1)),
      });
      months.forEach((m, mi) => {
        const days = eachDayOfInterval({
          start: startOfMonth(m),
          end: endOfMonth(m),
        });
        days.forEach((d, di) => {
          const base = 220 + mi * 25 + (di % 5) * 18;
          const jitter = ((mi * 37 + di * 13) % 23) - 11;
          const amt = Math.max(50, Math.round(base + jitter));
          arr.push({
            id: `${yy}-${mi + 1}-${di + 1}-${storageKey}`,
            date: format(d, "yyyy-MM-dd"),
            amount: amt,
            note: `${title} batch`,
          });
        });
      });
    });
    return arr;
  }, [years, title, storageKey]);

  const { entries, setEntries } = useLocalEntries(storageKey, seed);

  // Form state
  const [date, setDate] = useState<string>(format(now, "yyyy-MM-dd"));
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  function addEntry() {
    const amt = Number(amount);
    if (!date || !isFinite(amt)) return;
    const id = `${date}-${amt}-${Math.random().toString(36).slice(2, 8)}`;
    const e: Entry = {
      id,
      date,
      amount: Math.round(amt * 100) / 100,
      note: note.trim(),
    };
    setEntries((prev) => [e, ...prev]);

    const d = new Date(date);
    const yy = getYear(d);
    const mm = getMonth(d) + 1;
    const q = (Math.floor(getMonth(d) / 3) + 1) as 1 | 2 | 3 | 4;
    const base = startOfWeek(startOfMonth(new Date(yy, mm - 1, 1)), {
      weekStartsOn: 1,
    });
    const diffDays = Math.floor((d.getTime() - base.getTime()) / 86400000);
    const wk = Math.max(1, Math.min(4, Math.floor(diffDays / 7) + 1));
    setYear(yy);
    setQuarter(q);
    setMonth(mm);
    setWeek(wk);
    setScale("monthly");

    setAmount("");
    setNote("");
  }
  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // Range helpers
  function currentRange(): { start: Date; end: Date } {
    if (scale === "yearly") {
      const s = startOfYear(new Date(year, 0, 1));
      return { start: s, end: endOfYear(s) };
    }
    if (scale === "quarterly") {
      const m0 = (quarter - 1) * 3;
      const s = startOfMonth(new Date(year, m0, 1));
      return { start: s, end: endOfMonth(new Date(year, m0 + 2, 1)) };
    }
    if (scale === "monthly") {
      const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
      return { start: s, end: endOfMonth(s) };
    }
    if (scale === "weekly" || scale === "daily") {
      if (week === 0) {
        const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
        return { start: s, end: endOfMonth(s) };
      }
      const base = startOfWeek(
        startOfMonth(new Date(year, effectiveMonth - 1, 1)),
        { weekStartsOn: 1 },
      );
      const s = addDays(base, (week - 1) * 7);
      return { start: s, end: addDays(s, 6) };
    }
    return { start: now, end: now };
  }

  const range = useMemo(
    () => currentRange(),
    [scale, year, quarter, effectiveMonth, week],
  );

  // Filter entries for range
  const rangedEntries = useMemo(() => {
    const s = range.start.getTime();
    const e = addDays(range.end, 1).getTime();
    return entries.filter((en) => {
      const t = new Date(en.date).getTime();
      return t >= s && t < e;
    });
  }, [entries, range]);

  // Buckets for chart
  type Bucket = { label: string; total: number };
  const data: Bucket[] = useMemo(() => {
    if (scale === "yearly") {
      const arr = Array.from({ length: 12 }, (_, i) => ({
        label: format(new Date(2000, i, 1), "MMM"),
        total: 0,
      }));
      entries.forEach((en) => {
        const d = new Date(en.date);
        if (getYear(d) === year) arr[getMonth(d)].total += en.amount;
      });
      return arr;
    }
    if (scale === "quarterly") {
      const arr = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({ label: q, total: 0 }));
      entries.forEach((en) => {
        const d = new Date(en.date);
        if (getYear(d) !== year) return;
        const q = Math.floor(getMonth(d) / 3);
        arr[q].total += en.amount;
      });
      return arr;
    }
    if (scale === "monthly") {
      const s = startOfMonth(range.start);
      const days = eachDayOfInterval({ start: s, end: endOfMonth(s) });
      const arr = days.map((d) => ({ label: format(d, "d"), total: 0 }));
      rangedEntries.forEach((en) => {
        const d = new Date(en.date);
        const idx = getDate(d) - 1;
        if (idx >= 0 && idx < arr.length) arr[idx].total += en.amount;
      });
      return arr;
    }
    if (scale === "weekly") {
      if (week === 0) {
        const base = startOfWeek(
          startOfMonth(new Date(year, effectiveMonth - 1, 1)),
          { weekStartsOn: 1 },
        );
        const arr = [1, 2, 3, 4].map((w) => ({ label: `Wk ${w}`, total: 0 }));
        rangedEntries.forEach((en) => {
          const d = new Date(en.date);
          const diffDays = Math.floor((d.getTime() - base.getTime()) / 86400000);
          const wk = Math.floor(diffDays / 7) + 1;
          const idx = Math.min(Math.max(wk, 1), 4) - 1;
          arr[idx].total += en.amount;
        });
        return arr;
      }
      const days = eachDayOfInterval({ start: range.start, end: range.end });
      const arr = days.map((d) => ({ label: format(d, "EEE"), total: 0 }));
      rangedEntries.forEach((en) => {
        const d = new Date(en.date);
        const idx = Math.floor(
          (d.getTime() - range.start.getTime()) / 86400000,
        );
        if (idx >= 0 && idx < arr.length) arr[idx].total += en.amount;
      });
      return arr;
    }
    // daily -> if week=0 show full month days, else 7 days (1..7) of selected week
    if (week === 0) {
      const s = startOfMonth(new Date(year, effectiveMonth - 1, 1));
      const days = eachDayOfInterval({ start: s, end: endOfMonth(s) });
      const arr = days.map((d) => ({ label: format(d, "d"), total: 0 }));
      rangedEntries.forEach((en) => {
        const d = new Date(en.date);
        const idx = getDate(d) - 1;
        if (idx >= 0 && idx < arr.length) arr[idx].total += en.amount;
      });
      return arr;
    }
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    const arr = days.map((_d, i) => ({ label: String(i + 1), total: 0 }));
    rangedEntries.forEach((en) => {
      const d = new Date(en.date);
      const idx = Math.floor(
        (d.getTime() - range.start.getTime()) / 86400000,
      );
      if (idx >= 0 && idx < arr.length) arr[idx].total += en.amount;
    });
    return arr;
  }, [scale, entries, rangedEntries, range, year]);

  const total = useMemo(() => data.reduce((a, b) => a + b.total, 0), [data]);

  const xTicks = useMemo(() => data.map((d) => d.label), [data]);
  const xInterval = useMemo(
    () => (data.length > 16 ? ("preserveStartEnd" as const) : 0),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2 min-w-0">
            <Tabs value={scale} onValueChange={(v) => setScale(v as Scale)}>
              <TabsList>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
            </Tabs>
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
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Date</div>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Amount</div>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Note</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Description"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button onClick={addEntry}>Add</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4 h-72 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={scale} data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                ticks={xTicks}
                interval={xInterval}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <ReTooltip />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-1">
            Total in range: ${total.toLocaleString()}
          </div>
          <div className="max-h-64 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rangedEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {format(new Date(e.date), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>${e.amount.toLocaleString()}</TableCell>
                    <TableCell>{e.note}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removeEntry(e.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{rangedEntries.length} item(s)</TableCaption>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Finance() {
  // Invoices mock + filters
  type InvoiceItem = { name: string; price: number };
  type Invoice = {
    id: string;
    date: string; // yyyy-MM-dd
    time: string; // HH:mm
    customerName: string;
    phone: string;
    gender: "Male" | "Female";
    items: InvoiceItem[];
    subtotal: number;
    paid: number;
  };

  const now = new Date();
  const [scaleI, setScaleI] = useState<Scale>("monthly");
  const [yearI, setYearI] = useState<number>(getYear(now));
  const [quarterI, setQuarterI] = useState<1 | 2 | 3 | 4>(
    (Math.floor(getMonth(now) / 3) + 1) as 1 | 2 | 3 | 4,
  );
  const [monthI, setMonthI] = useState<number>(getMonth(now) + 1);
  const [weekI, setWeekI] = useState<number>(1); // 0 = All

  const yearsI = useMemo(() => {
    const cy = getYear(now);
    return Array.from({ length: 6 }, (_, i) => cy - 5 + i);
  }, [now]);

  const monthsAllI = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: format(new Date(2000, i, 1), "MMM"),
      })),
    [],
  );
  const monthsToShowI = useMemo(() => {
    const start = (quarterI - 1) * 3 + 1;
    const end = start + 2;
    return monthsAllI.filter((m) => m.value >= start && m.value <= end);
  }, [monthsAllI, quarterI]);
  const effectiveMonthI = useMemo(() => {
    const start = (quarterI - 1) * 3 + 1;
    const end = start + 2;
    return clamp(monthI, start, end);
  }, [monthI, quarterI]);

  // Seed invoices deterministically
  function rand(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  const productNames = [
    "Spanish Latte",
    "Americano",
    "Iced Caramel",
    "Croissant",
    "Cappuccino",
    "Mocha",
  ];
  const customers = [
    { name: "Ali Hassan", phone: "+201234567890", gender: "Male" as const },
    { name: "Sara Ahmed", phone: "+201112223334", gender: "Female" as const },
    { name: "Omar Noor", phone: "+201009998877", gender: "Male" as const },
    { name: "Mona Adel", phone: "+201555667788", gender: "Female" as const },
  ];

  const invoices: Invoice[] = useMemo(() => {
    const arr: Invoice[] = [];
    yearsI.forEach((yy, yi) => {
      for (let m = 0; m < 12; m++) {
        const start = startOfMonth(new Date(yy, m, 1));
        const end = endOfMonth(start);
        const days = eachDayOfInterval({ start, end });
        days.forEach((d, di) => {
          const count = 1 + Math.floor(rand(yy * 10000 + (m + 1) * 100 + di) * 3); // 1..3 invoices/day
          for (let k = 0; k < count; k++) {
            const cust = customers[(yi + m + di + k) % customers.length];
            const itemsCount = 1 + Math.floor(rand(di * 50 + k * 7) * 3); // 1..3 items
            const items: InvoiceItem[] = Array.from({ length: itemsCount }, (_, j) => {
              const name = productNames[(m + di + j) % productNames.length];
              const base = 35 + ((m + di + j) % 5) * 7;
              const price = Math.round((base + rand(yy + di + j) * 10) * 100) / 100;
              return { name, price };
            });
            const subtotal = Math.round(items.reduce((a, b) => a + b.price, 0) * 100) / 100;
            const paid = Math.round((subtotal - Math.floor(rand(di + k) * 3)) * 100) / 100; // sometimes leave small balance
            const id = `${yy}${String(m + 1).padStart(2, "0")}${String(di + 1).padStart(2, "0")}-${k}${String(Math.floor(rand(k + di + m) * 9999)).padStart(4, "0")}`;
            const hh = String(Math.floor(rand(yy + di + k) * 12) + 8).padStart(2, "0");
            const mm = String(Math.floor(rand(yi + m + di + k) * 60)).padStart(2, "0");
            arr.push({
              id,
              date: format(d, "yyyy-MM-dd"),
              time: `${hh}:${mm}`,
              customerName: cust.name,
              phone: cust.phone,
              gender: cust.gender,
              items,
              subtotal,
              paid: Math.min(subtotal, paid),
            });
          }
        });
      }
    });
    return arr;
  }, [yearsI]);

  function rangeI(): { start: Date; end: Date } {
    if (scaleI === "yearly") {
      const s = startOfYear(new Date(yearI, 0, 1));
      return { start: s, end: endOfYear(s) };
    }
    if (scaleI === "quarterly") {
      const m0 = (quarterI - 1) * 3;
      const s = startOfMonth(new Date(yearI, m0, 1));
      return { start: s, end: endOfMonth(new Date(yearI, m0 + 2, 1)) };
    }
    if (scaleI === "monthly") {
      const s = startOfMonth(new Date(yearI, effectiveMonthI - 1, 1));
      return { start: s, end: endOfMonth(s) };
    }
    if (scaleI === "weekly" || scaleI === "daily") {
      if (weekI === 0) {
        const s = startOfMonth(new Date(yearI, effectiveMonthI - 1, 1));
        return { start: s, end: endOfMonth(s) };
      }
      const base = startOfWeek(
        startOfMonth(new Date(yearI, effectiveMonthI - 1, 1)),
        { weekStartsOn: 1 },
      );
      const s = addDays(base, (weekI - 1) * 7);
      return { start: s, end: addDays(s, 6) };
    }
    return { start: now, end: now };
  }

  const iRange = useMemo(() => rangeI(), [scaleI, yearI, quarterI, effectiveMonthI, weekI]);
  const filteredInvoices = useMemo(() => {
    const s = iRange.start.getTime();
    const e = addDays(iRange.end, 1).getTime();
    return invoices.filter((inv) => {
      const t = new Date(inv.date).getTime();
      return t >= s && t < e;
    });
  }, [invoices, iRange]);

  return (
    <DashboardLayout title="Finance">
      {/* Invoices table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Filter by period to view detailed invoice records.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-2 min-w-0">
            <Tabs value={scaleI} onValueChange={(v) => setScaleI(v as Scale)}>
              <TabsList>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={String(yearI)} onValueChange={(v) => setYearI(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                {yearsI.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(quarterI)} onValueChange={(v) => setQuarterI(Number(v) as any)}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Quarter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Q1</SelectItem>
                <SelectItem value="2">Q2</SelectItem>
                <SelectItem value="3">Q3</SelectItem>
                <SelectItem value="4">Q4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(effectiveMonthI)} onValueChange={(v) => setMonthI(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {monthsToShowI.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(weekI)} onValueChange={(v) => setWeekI(Number(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Week" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All</SelectItem>
                {[1, 2, 3, 4].map((w) => (
                  <SelectItem key={w} value={String(w)}>{`Wk ${w}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Item Prices</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const balance = Math.max(0, Math.round((inv.subtotal - inv.paid) * 100) / 100);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell>{inv.time}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell>{inv.phone}</TableCell>
                      <TableCell>{inv.gender}</TableCell>
                      <TableCell>
                        <div className="max-w-[220px] truncate" title={inv.items.map((i)=>i.name).join(", ")}>{inv.items.map((i) => i.name).join(", ")}</div>
                      </TableCell>
                      <TableCell>
                        {inv.items.map((i, idx) => (
                          <div key={idx}>${i.price.toFixed(2)}</div>
                        ))}
                      </TableCell>
                      <TableCell>${inv.subtotal.toFixed(2)}</TableCell>
                      <TableCell>${inv.paid.toFixed(2)}</TableCell>
                      <TableCell className={balance > 0 ? "text-amber-700" : "text-emerald-700"}>${balance.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <CostSection
          title="Cost of Goods Sold (COGS)"
          storageKey="finance_cogs_entries"
          description="Add entries to update the chart in real time. Filter annually, quarterly, monthly, weekly, or daily."
        />

        <CostSection
          title="Technology & Platform Costs"
          storageKey="finance_tech_platform_entries"
          description="Track cloud, subscriptions, and tooling costs with real-time chart and filters."
        />

        <CostSection
          title="Variable Costs"
          storageKey="finance_variable_entries"
          description="Track variable expenses with real-time chart and filters."
        />

        {/* Coming soon moved to bottom */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Expenses (OPEX)</CardTitle>
            <CardDescription>Coming soon.</CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fixed Costs</CardTitle>
            <CardDescription>Coming soon.</CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Miscellaneous / Hidden Costs</CardTitle>
            <CardDescription>Coming soon.</CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
