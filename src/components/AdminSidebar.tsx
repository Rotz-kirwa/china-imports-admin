import { LayoutDashboard, Users, CreditCard, ShoppingCart, MessageCircle, Boxes, CalendarDays, Star, RotateCcw, Package, MessagesSquare, Images, Plane, Search, Database } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { BrandLogo } from "@/components/BrandLogo";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Database },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Featured Gallery", url: "/featured-gallery", icon: Images },
  { title: "Users", url: "/users", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Inquiries", url: "/inquiries", icon: MessagesSquare },
  { title: "Sourcing Requests", url: "/sourcing-requests", icon: Search },
  { title: "Travel Requests", url: "/travel-requests", icon: Plane },
  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "Chats", url: "/chats", icon: MessageCircle },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: adminApi.notifications,
    refetchInterval: 15000, // Check every 15 seconds
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-10 w-10" />
            {!collapsed && (
              <h1 className="font-display text-lg font-bold text-sidebar-accent-foreground tracking-tight">
                MI and IN Admin
              </h1>
            )}
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {(() => {
                          if (collapsed) return null;
                          let count = 0;
                          if (item.title === "Inquiries") count = notifications?.unreadInquiries ?? 0;
                          if (item.title === "Sourcing Requests") count = notifications?.unreadSourcing ?? 0;
                          if (item.title === "Travel Requests") count = notifications?.unreadTravel ?? 0;
                          
                          if (count > 0) {
                            return (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                                {count}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
