"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, DollarSign, CreditCard, Settings } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Link } from '@/components/layout/page-loader';

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Bot", href: "/dashboard/bots/new", icon: PlusCircle },
];

const secondaryNav = [
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="grid items-start px-2 text-sm font-medium">
        <SidebarMenu>
          {primaryNav.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.name}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <Separator className="my-4" />
        <SidebarMenu>
          {secondaryNav.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.name}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </nav>
    </div>
  );
}
