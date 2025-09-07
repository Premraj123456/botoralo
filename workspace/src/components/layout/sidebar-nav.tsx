
"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, DollarSign, CreditCard, Settings, Rocket } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from '@/components/layout/page-loader';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Bot", href: "/dashboard/bots/new", icon: PlusCircle },
];

const secondaryNav = [
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const setupNav = [
    { name: "Seed Products", href: "/dashboard/seed-products", icon: Rocket },
]

export function SidebarNav() {
  const pathname = usePathname();

  const renderNav = (items: typeof primaryNav) => (
    items.map((item) => (
      <li key={item.name}>
        <Button
          asChild
          variant={pathname === item.href ? "secondary" : "ghost"}
          className="w-full justify-start gap-2"
        >
          <Link href={item.href}>
            <item.icon />
            <span>{item.name}</span>
          </Link>
        </Button>
      </li>
    ))
  );

  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="grid items-start px-2 text-sm font-medium">
        <ul className="flex flex-col gap-1">
          {renderNav(primaryNav)}
        </ul>
        <Separator className="my-4" />
        <ul className="flex flex-col gap-1">
          {renderNav(secondaryNav)}
        </ul>
         <Separator className="my-4" />
         <div>
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Setup</p>
            <ul className="flex flex-col gap-1 mt-1">
                {renderNav(setupNav)}
            </ul>
        </div>
      </nav>
    </div>
  );
}
