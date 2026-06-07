export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
export const ADMIN_TOKEN_KEY = "bci-admin-token";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Admin request failed.");
  }
  return data as T;
}

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  joinedAt: string;
};

export type InquiryRecord = {
  id: string;
  kind: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  productInterest?: string | null;
  destination?: string | null;
  travelDates?: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export const adminApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: AdminSessionUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: AdminSessionUser }>("/auth/me"),
  dashboard: () =>
    request<{
      stats: { users: number; revenue: number; orders: number; activeChats: number };
      revenueData: Array<{ month: string; revenue: number }>;
      orderData: Array<{ day: string; orders: number }>;
      recentOrders: Array<Record<string, unknown>>;
      recentChats: Array<Record<string, unknown>>;
    }>("/admin/dashboard"),
  notifications: () => request<{ unreadInquiries: number }>("/admin/notifications"),
  users: () => request<{ users: Array<Record<string, unknown>> }>("/admin/users"),
  orders: () => request<{ orders: Array<Record<string, unknown>> }>("/admin/orders"),
  order: (id: string) => request<{ order: Record<string, unknown>; items: Array<Record<string, unknown>> }>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string, notes?: string) =>
    request<{ message: string }>(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    }),
  payments: () => request<{ payments: Array<Record<string, unknown>> }>("/admin/payments"),

  appointments: () => request<{ appointments: Array<Record<string, unknown>> }>("/admin/appointments"),
  reviews: () => request<{ reviews: Array<Record<string, unknown>> }>("/admin/reviews"),
  updateReviewStatus: (id: string, status: "approved" | "rejected") =>
    request<{ message: string }>(`/admin/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  returns: () => request<{ returns: Array<Record<string, unknown>> }>("/admin/returns"),
  inquiries: () => request<{ inquiries: InquiryRecord[] }>("/admin/inquiries"),
  updateInquiryStatus: (id: string, status: "new" | "reviewing" | "contacted" | "quoted" | "resolved" | "closed") =>
    request<{ inquiry: InquiryRecord; message: string }>(`/admin/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  reports: () =>
    request<{
      summary: {
        revenue: number;
        cogs: number;
        grossProfit: number;
        pendingPayments: number;
        lowStockItems: number;
      };
      productProfitability: Array<Record<string, unknown>>;
      monthlyPerformance: Array<Record<string, unknown>>;
      revenueByType: Array<Record<string, unknown>>;
    }>("/admin/reports"),
  chats: () => request<{ chats: Array<Record<string, unknown>> }>("/admin/chats"),
  chatMessages: (id: string) => request<{ messages: Array<{ from: string; text: string; time: string }> }>(`/admin/chats/${id}/messages`),
  sendChatMessage: (id: string, body: string) =>
    request<{ message: string }>(`/admin/chats/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  confirmPayment: (id: string, status: "completed" | "failed") =>
    request<{ message: string }>(`/admin/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateAppointment: (id: string, status: "approved" | "rejected" | "completed") =>
    request<{ message: string }>(`/admin/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateReturn: (id: string, status: "approved" | "rejected" | "resolved", resolution: string) =>
    request<{ message: string }>(`/admin/returns/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution }),
    }),

  getProducts: () => request<{ products: Array<Record<string, unknown>> }>("/admin/products"),
  createProduct: (data: Record<string, unknown>) =>
    request<{ message: string }>("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    request<{ message: string }>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, { method: "DELETE" }),
  getTravelRequests: () =>
    request<{
      travelRequests: Array<{
        id: string; inquiryId: string | null; name: string; email: string; phone: string | null;
        destination: string; travelDates: string | null; details: string | null; message: string | null;
        status: string; createdAt: string;
      }>;
    }>("/admin/travel-requests"),
  updateTravelRequest: (id: string, status: "new" | "reviewing" | "contacted" | "arranged" | "completed" | "cancelled") =>
    request<{ message: string; status: string }>(`/admin/travel-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getFeaturedGallery: () =>
    request<{ items: Array<{ id: string; imageUrl: string; sortOrder: number }> }>("/featured-gallery"),
  addFeaturedGalleryItem: (imageUrl: string) =>
    request<{ item: { id: string; imageUrl: string; sortOrder: number }; message: string }>("/admin/featured-gallery", {
      method: "POST",
      body: JSON.stringify({ imageUrl }),
    }),
  deleteFeaturedGalleryItem: (id: string) =>
    request<{ message: string }>(`/admin/featured-gallery/${id}`, { method: "DELETE" }),
};
