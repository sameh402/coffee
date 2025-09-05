import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Coffee,
  Home,
  PackageSearch,
  PiggyBank,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="size-8 grid place-items-center rounded-md bg-primary text-primary-foreground">
        <Coffee className="size-4" />
      </div>
      <div className="leading-tight group-data-[collapsible=icon]:hidden">
        <div className="font-semibold">BeanBoard</div>
        <div className="text-xs text-muted-foreground">Coffee Admin</div>
      </div>
    </div>
  );
}

function NavItems() {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/overview" && location.pathname === "/");

  const items = [
    { to: "/overview", label: "Overview", icon: Home },
    { to: "/stock", label: "Stock", icon: PackageSearch },
    { to: "/finance", label: "Finance", icon: PiggyBank },
    { to: "/customer-service", label: "Customer Service", icon: Headphones },
  ];

  return (
    <SidebarMenu>
      {items.map(({ to, label, icon: Icon }) => (
        <SidebarMenuItem key={to}>
          <NavLink to={to} className="block">
            <SidebarMenuButton isActive={isActive(to)}>
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
          </NavLink>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default function DashboardLayout({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (loc.pathname !== "/login") {
      try {
        const authed = localStorage.getItem("auth") === "1";
        if (!authed) navigate(`/login?to=${encodeURIComponent(loc.pathname)}`);
      } catch {}
    }
  }, [loc, navigate]);

  const [addOpen, setAddOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCat, setPCat] = useState<"coffee bean" | "coffee" | "drink">("drink");
  const [basePrice, setBasePrice] = useState("");
  const variantLabels = pCat === "drink" ? ["Small", "Medium", "Large"] : ["250g", "500g", "1000g"];
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({ Small: "", Medium: "", Large: "" });
  const [images, setImages] = useState<string[]>([]);

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    const urls = files.map((f) => URL.createObjectURL(f));
    setImages(urls);
  }
  function onChangeCategory(val: "coffee bean" | "coffee" | "drink") {
    setPCat(val);
    const labels = val === "drink" ? ["Small", "Medium", "Large"] : ["250g", "500g", "1000g"];
    const next: Record<string, string> = {} as any;
    labels.forEach((l) => (next[l] = ""));
    setVariantPrices(next);
  }
  function onSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    setAddOpen(false);
    alert("Product submitted");
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavItems />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="px-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} BeanBoard
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-14 items-center gap-3 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1 flex items-center gap-3">
              <h1 className="text-sm md:text-base font-semibold tracking-tight">
                {title ?? "Dashboard"}
              </h1>
              <div className="hidden md:flex items-center gap-2 ml-auto">
                <Input placeholder="Search…" className="w-64" />
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Product</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Product</DialogTitle>
                      <DialogDescription>Provide details and pricing. Images are optional (max 3).</DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-4" onSubmit={onSubmitProduct}>
                      <div className="grid gap-2">
                        <Label>Images</Label>
                        <Input type="file" accept="image/*" multiple onChange={onPickImages} />
                        {images.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {images.map((src, i) => (
                              <img key={i} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md border" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Product Name</Label>
                        <Input value={pName} onChange={(e)=>setPName(e.target.value)} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea value={pDesc} onChange={(e)=>setPDesc(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Category</Label>
                        <select className="border rounded-md h-9 px-3 text-sm" value={pCat} onChange={(e)=>onChangeCategory(e.target.value as any)}>
                          <option value="coffee bean">Coffee Bean</option>
                          <option value="coffee">Coffee</option>
                          <option value="drink">Drink</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Price Categories</Label>
                        <div className="rounded-md border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-secondary/50">
                                <th className="text-left p-2">Variant</th>
                                <th className="text-left p-2">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {variantLabels.map((vl) => (
                                <tr key={vl} className="border-t">
                                  <td className="p-2">{vl}</td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={variantPrices[vl] ?? ""}
                                      onChange={(e)=>setVariantPrices((prev)=>({ ...prev, [vl]: e.target.value }))}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={()=>setAddOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Product</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="secondary" onClick={() => window.print()}>Export PDF</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="size-8 cursor-pointer">
                      <AvatarFallback>SE</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        try { localStorage.removeItem("auth"); } catch {}
                        window.location.href = "/login";
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
