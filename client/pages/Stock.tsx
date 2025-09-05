import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useMemo, useState } from "react";
import AddProductButton from "@/components/stock/AddProductButton";

// Demo stock model
type Raw = { id: string; name: string; unit: string; qty: number };

type RecipeItem = { rawId: string; amount: number };

type Product = {
  id: string;
  name: string;
  category: "Coffee" | "Bakery" | "Cold";
  recipe: RecipeItem[];
};

const raws: Raw[] = [
  { id: "beans", name: "Arabica Beans", unit: "g", qty: 20000 },
  { id: "milk", name: "Milk", unit: "ml", qty: 8000 },
  { id: "syrup", name: "Caramel Syrup", unit: "ml", qty: 1200 },
  { id: "sugar", name: "Sugar", unit: "g", qty: 5000 },
  { id: "ice", name: "Ice", unit: "g", qty: 10000 },
  { id: "cup", name: "12oz Cup", unit: "pcs", qty: 120 },
];

const products: Product[] = [
  {
    id: "spanish_latte",
    name: "Spanish Latte",
    category: "Coffee",
    recipe: [
      { rawId: "beans", amount: 18 },
      { rawId: "milk", amount: 220 },
      { rawId: "sugar", amount: 8 },
      { rawId: "cup", amount: 1 },
    ],
  },
  {
    id: "americano",
    name: "Americano",
    category: "Coffee",
    recipe: [
      { rawId: "beans", amount: 15 },
      { rawId: "cup", amount: 1 },
    ],
  },
  {
    id: "iced_caramel",
    name: "Iced Caramel",
    category: "Cold",
    recipe: [
      { rawId: "beans", amount: 16 },
      { rawId: "milk", amount: 120 },
      { rawId: "syrup", amount: 25 },
      { rawId: "ice", amount: 180 },
      { rawId: "cup", amount: 1 },
    ],
  },
  {
    id: "croissant",
    name: "Croissant",
    category: "Bakery",
    recipe: [
      { rawId: "sugar", amount: 12 },
      { rawId: "cup", amount: 0 },
    ],
  },
];

function coverageForProduct(p: Product, stock: Raw[]) {
  const limits = p.recipe.map((ri) => {
    const raw = stock.find((r) => r.id === ri.rawId);
    if (!raw) return 0;
    if (ri.amount === 0) return Infinity;
    return Math.floor(raw.qty / ri.amount);
  });
  return Math.max(0, Math.min(...limits));
}

export default function Stock() {
  const [selected, setSelected] = useState<string | null>(null);
  const [autoOrder, setAutoOrder] = useState(false);

  const selectedProduct = products.find((p) => p.id === selected) ?? null;

  const missingForSelected = useMemo(() => {
    if (!selectedProduct) return [] as { raw: Raw; needed: number }[];
    return selectedProduct.recipe
      .map((ri) => {
        const raw = raws.find((r) => r.id === ri.rawId)!;
        const needed = Math.max(0, ri.amount - raw.qty);
        return { raw, needed };
      })
      .filter((r) => r.needed > 0);
  }, [selectedProduct]);

  // Estimate required units for tomorrow and compare against coverage
  function prng(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  function predictedTomorrowUnits(p: Product) {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const base = p.category === "Coffee" ? 120 : p.category === "Cold" ? 80 : 60;
    const dow = today.getDay();
    const dowFactor = [0.9, 0.95, 1.0, 1.05, 1.1, 1.25, 1.3][dow];
    const noise = 0.8 + prng(seed + p.id.length * 7) * 0.6; // 0.8..1.4
    return Math.max(0, Math.round(base * dowFactor * noise));
  }
  const readinessRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    required: predictedTomorrowUnits(p),
    coverage: coverageForProduct(p, raws),
  }));

  return (
    <DashboardLayout title="Stock Management">
      {/* Actions */}
      <div className="mb-4 flex justify-end">
        <AddProductButton />
      </div>

      {/* Readiness & Coverage table */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tomorrow Required & Coverage</CardTitle>
            <CardDescription>Plan production to avoid stockouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Required Tomorrow</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readinessRows.map((r) => {
                  const inStock = r.coverage >= r.required;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.required}</TableCell>
                      <TableCell>{r.coverage}</TableCell>
                      <TableCell>
                        {inStock ? (
                          <Badge className="bg-emerald-600">Ready</Badge>
                        ) : (
                          <Badge className="bg-amber-600">Short</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Products table */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Full-width inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const cover = coverageForProduct(p, raws);
                  const inStock = cover > 0;
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(p.id)}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{cover}</TableCell>
                      <TableCell>
                        {inStock ? (
                          <Badge className="bg-emerald-600">In Stock</Badge>
                        ) : (
                          <Badge className="bg-rose-600">Out</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!inStock ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(p.id);
                            }}
                          >
                            View Raw Materials
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableCaption>
                Click any row to see required raw materials.
              </TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Raw materials below products */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Raw Materials</CardTitle>
            <CardDescription>
              {selectedProduct
                ? selectedProduct.name
                : "Select a product to view its recipe"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">
                    Auto-order missing
                  </div>
                  <Switch checked={autoOrder} onCheckedChange={setAutoOrder} />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProduct.recipe.map((ri) => {
                      const raw = raws.find((r) => r.id === ri.rawId)!;
                      const missing = raw.qty < ri.amount;
                      return (
                        <TableRow key={ri.rawId}>
                          <TableCell className="font-medium">
                            {raw.name}
                          </TableCell>
                          <TableCell>
                            {ri.amount} {raw.unit}
                          </TableCell>
                          <TableCell>
                            {raw.qty} {raw.unit}
                          </TableCell>
                          <TableCell>
                            {missing ? (
                              <Badge className="bg-amber-600">Missing</Badge>
                            ) : (
                              <Badge className="bg-emerald-600">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {missing ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  alert(
                                    `${autoOrder ? "Auto-order enabled. " : ""}Ordering ${raw.name}`,
                                  )
                                }
                              >
                                Order Now
                              </Button>
                            ) : (
                              <Button size="sm" variant="secondary" disabled>
                                Ready
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No product selected.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
