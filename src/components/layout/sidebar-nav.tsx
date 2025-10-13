
"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, DollarSign, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ClientLink } from '@/components/layout/client-link';
import { Button } from "@/components/ui/button";

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Bot", href: "/dashboard/bots/new", icon: PlusCircle },
];

const secondaryNav = [
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export function SidebarNav() {
  const pathname = usePathname();

  const renderNav = (items: {name: string, href: string, icon: any}[]) => (
    items.map((item) => (
      <li key={item.name}>
        <Button
          asChild
          variant={pathname === item.href ? "secondary" : "ghost"}
          className="w-full justify-start gap-2"
        >
          <ClientLink href={item.href}>
            <item.icon />
            <span>{item.name}</span>
          </ClientLink>
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
      </nav>
    </div>
  );
}
