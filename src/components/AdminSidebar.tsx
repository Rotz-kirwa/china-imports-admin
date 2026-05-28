import { LayoutDashboard, Users, CreditCard, ShoppingCart, MessageCircle, Boxes, CalendarDays, Star, RotateCcw, BarChart3, Package, MessagesSquare, Images, Plane } from "lucide-react";
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
  { title: "Featured Gallery", url: "/featured-gallery", icon: Images },
  { title: "Users", url: "/users", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Inquiries", url: "/inquiries", icon: MessagesSquare },
  { title: "Travel Requests", url: "/travel-requests", icon: Plane },

  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "Reports", url: "/reports", icon: BarChart3 },
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
                        {!collapsed && item.title === "Inquiries" && (notifications?.unreadInquiries ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                            {notifications!.unreadInquiries}
                          </span>
                        )}
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
