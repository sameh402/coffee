import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Enter a product name"),
  category: z.string().min(1, "Choose a category"),
  unit: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.coerce.number().int().min(0, "Stock must be >= 0"),
  imageUrl: z
    .string()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
});

type ProductInput = z.infer<typeof productSchema>;

type Product = ProductInput & {
  id: string;
  addedAt: string; // ISO date
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const CATEGORIES = ["Coffee", "Bakery", "Cold", "Merch"] as const;
const UNITS = ["g", "ml", "pcs"] as const;
const WEIGHT_SIZES = [250, 500, 750, 1000] as const;

export default function Store() {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem("catalog");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Product[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("catalog", JSON.stringify(items));
    } catch {}
  }, [items]);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "g",
      size: "",
      price: 0,
      sku: "",
      stock: 0,
      imageUrl: "",
      description: "",
    },
  });

  const onSubmit = (values: ProductInput) => {
    const product: Product = {
      ...values,
      imageUrl: values.imageUrl && values.imageUrl.trim() !== "" ? values.imageUrl : "/placeholder.svg",
      id: uid(),
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, product]);
    toast({ title: "Product added", description: `${values.name} has been added to your catalog.` });
    form.reset({ ...form.getValues(), name: "", category: form.getValues("category"), unit: form.getValues("unit"), size: "", price: 0, sku: "", stock: 0, description: "", imageUrl: "" });
  };

  const totalSkus = items.length;
  const totalInventory = useMemo(() => items.reduce((s, it) => s + (Number.isFinite(it.stock) ? it.stock : 0), 0), [items]);

  return (
    <DashboardLayout title="Online Store">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Product</CardTitle>
            <CardDescription>Fill the form to append a product to the catalog below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="e.g. Ground Coffee" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(v) => form.setValue("category", v)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="price">Price ($, per size)</Label>
                  <Input id="price" type="number" step="0.01" min={0} {...form.register("price", { valueAsNumber: true })} />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" min={0} {...form.register("stock", { valueAsNumber: true })} />
                  {form.formState.errors.stock && (
                    <p className="text-sm text-destructive">{form.formState.errors.stock.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="e.g. GRND-250" {...form.register("sku")} />
                  {form.formState.errors.sku && (
                    <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input id="imageUrl" placeholder="https://..." {...form.register("imageUrl")} />
                  {form.formState.errors.imageUrl && (
                    <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="unit">Unit</Label>
                  <Select onValueChange={(v) => form.setValue("unit", v)}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="size">Size/Variant</Label>
                  <Select onValueChange={(v) => form.setValue("size", v)}>
                    <SelectTrigger id="size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.watch("category") === "Coffee" ? (
                        WEIGHT_SIZES.map((w) => (
                          <SelectItem key={w} value={`${w}${form.watch("unit") || "g"}`}>{w}{form.watch("unit") || "g"}</SelectItem>
                        ))
                      ) : (
                        ["One size", "Small", "Medium", "Large"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} placeholder="Short description" {...form.register("description")} />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit">Add to Catalog</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                {items.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setItems([])}
                    className="ml-auto text-destructive"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Catalog table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>
              {totalSkus} products • {totalInventory} total units in stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="size-10 rounded-md object-cover border" />
                      <div>
                        <div className="font-medium leading-tight">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.size || "-"}</TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{new Date(p.addedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Newly added products appear at the bottom.</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
