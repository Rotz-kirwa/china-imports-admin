import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

export function AdminLayout() {
  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || "http://localhost:8080/";
  const { user, logout } = useAdminAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <BrandLogo className="h-9 w-9" />
              <span className="font-display font-semibold text-sm text-muted-foreground">MI and IN Global Admin</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "Secure session"}</p>
              </div>
              <a
                href={storefrontUrl}
                className="text-sm font-medium text-primary hover:underline"
              >
                View Storefront
              </a>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
