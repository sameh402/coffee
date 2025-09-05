import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="size-8 grid place-items-center rounded-md bg-primary text-primary-foreground">
        <Coffee className="size-4" />
      </div>
      <div className="leading-tight">
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
                <Button variant="secondary" onClick={() => window.print()}>Export PDF</Button>
                <Avatar className="size-8">
                  <AvatarFallback>SE</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
