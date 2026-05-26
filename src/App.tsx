import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthProvider, useAdminAuth } from "@/context/AuthContext";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const ChatsPage = lazy(() => import("@/pages/ChatsPage"));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const InquiriesPage = lazy(() => import("@/pages/InquiriesPage"));
const FeaturedGalleryPage = lazy(() => import("@/pages/FeaturedGalleryPage"));
const TravelRequestsPage = lazy(() => import("@/pages/TravelRequestsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
const basename = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

function RequireAdmin() {
  const location = useLocation();
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading admin session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={basename || "/"} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading admin...</div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<RequireAdmin />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/appointments" element={<AppointmentsPage />} />
                    <Route path="/reviews" element={<ReviewsPage />} />
                    <Route path="/inquiries" element={<InquiriesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/chats" element={<ChatsPage />} />
                    <Route path="/featured-gallery" element={<FeaturedGalleryPage />} />
                    <Route path="/travel-requests" element={<TravelRequestsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
