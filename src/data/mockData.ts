export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  joinedAt: string;
  avatar: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  date: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: number;
  total: number;
  status: "delivered" | "processing" | "shipped" | "cancelled";
  date: string;
}

export interface ChatMessage {
  id: string;
  userName: string;
  avatar: string;
  guestEmail?: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

export const users: User[] = [
  { id: "U001", name: "Sarah Chen", email: "sarah@example.com", role: "Admin", status: "active", joinedAt: "2024-01-15", avatar: "SC" },
  { id: "U002", name: "James Wilson", email: "james@example.com", role: "User", status: "active", joinedAt: "2024-02-20", avatar: "JW" },
  { id: "U003", name: "Maria Garcia", email: "maria@example.com", role: "User", status: "inactive", joinedAt: "2024-03-10", avatar: "MG" },
  { id: "U004", name: "Alex Thompson", email: "alex@example.com", role: "Moderator", status: "active", joinedAt: "2024-04-05", avatar: "AT" },
  { id: "U005", name: "Emily Davis", email: "emily@example.com", role: "User", status: "active", joinedAt: "2024-05-12", avatar: "ED" },
  { id: "U006", name: "Robert Kim", email: "robert@example.com", role: "User", status: "active", joinedAt: "2024-06-18", avatar: "RK" },
  { id: "U007", name: "Lisa Patel", email: "lisa@example.com", role: "Admin", status: "active", joinedAt: "2024-07-22", avatar: "LP" },
  { id: "U008", name: "David Brown", email: "david@example.com", role: "User", status: "inactive", joinedAt: "2024-08-30", avatar: "DB" },
];

export const payments: Payment[] = [
  { id: "P001", userId: "U001", userName: "Sarah Chen", amount: 299.99, status: "completed", method: "Credit Card", date: "2026-04-01" },
  { id: "P002", userId: "U002", userName: "James Wilson", amount: 149.50, status: "completed", method: "PayPal", date: "2026-04-02" },
  { id: "P003", userId: "U003", userName: "Maria Garcia", amount: 89.00, status: "pending", method: "Bank Transfer", date: "2026-04-03" },
  { id: "P004", userId: "U004", userName: "Alex Thompson", amount: 450.00, status: "completed", method: "Credit Card", date: "2026-04-03" },
  { id: "P005", userId: "U005", userName: "Emily Davis", amount: 35.99, status: "failed", method: "Credit Card", date: "2026-04-04" },
  { id: "P006", userId: "U006", userName: "Robert Kim", amount: 199.99, status: "completed", method: "PayPal", date: "2026-04-04" },
  { id: "P007", userId: "U007", userName: "Lisa Patel", amount: 599.00, status: "pending", method: "Bank Transfer", date: "2026-04-05" },
];

export const orders: Order[] = [
  { id: "ORD-001", userId: "U001", userName: "Sarah Chen", items: 3, total: 299.99, status: "delivered", date: "2026-04-01" },
  { id: "ORD-002", userId: "U002", userName: "James Wilson", items: 1, total: 149.50, status: "shipped", date: "2026-04-02" },
  { id: "ORD-003", userId: "U003", userName: "Maria Garcia", items: 2, total: 89.00, status: "processing", date: "2026-04-03" },
  { id: "ORD-004", userId: "U004", userName: "Alex Thompson", items: 5, total: 450.00, status: "delivered", date: "2026-04-03" },
  { id: "ORD-005", userId: "U005", userName: "Emily Davis", items: 1, total: 35.99, status: "cancelled", date: "2026-04-04" },
  { id: "ORD-006", userId: "U006", userName: "Robert Kim", items: 2, total: 199.99, status: "shipped", date: "2026-04-04" },
  { id: "ORD-007", userId: "U007", userName: "Lisa Patel", items: 4, total: 599.00, status: "processing", date: "2026-04-05" },
];

export const chats: ChatMessage[] = [
  { id: "C001", userName: "Sarah Chen", avatar: "SC", lastMessage: "Thanks for the quick response!", time: "2 min ago", unread: 2, online: true },
  { id: "C002", userName: "James Wilson", avatar: "JW", lastMessage: "When will my order arrive?", time: "15 min ago", unread: 1, online: true },
  { id: "C003", userName: "Maria Garcia", avatar: "MG", lastMessage: "I need help with my payment", time: "1 hr ago", unread: 0, online: false },
  { id: "C004", userName: "Alex Thompson", avatar: "AT", lastMessage: "Can I change my order?", time: "2 hrs ago", unread: 3, online: true },
  { id: "C005", userName: "Emily Davis", avatar: "ED", lastMessage: "Great service, thank you!", time: "5 hrs ago", unread: 0, online: false },
  { id: "C006", userName: "Robert Kim", avatar: "RK", lastMessage: "Is item #4521 in stock?", time: "1 day ago", unread: 0, online: false },
];
