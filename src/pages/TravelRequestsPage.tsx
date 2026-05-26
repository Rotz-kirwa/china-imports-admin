import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plane, MapPin, Calendar, Mail, Phone, User,
  ChevronDown, Clock, CheckCircle2, XCircle,
  MessageSquare, RefreshCw, Luggage,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type TravelRequest = {
  id: string;
  inquiryId: string | null;
  name: string;
  email: string;
  phone: string | null;
  destination: string;
  travelDates: string | null;
  details: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

type Status = "new" | "reviewing" | "contacted" | "arranged" | "completed" | "cancelled";

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  new:       { label: "New",       color: "#1d4ed8", bg: "#dbeafe", icon: Clock },
  reviewing: { label: "Reviewing", color: "#7c3aed", bg: "#ede9fe", icon: RefreshCw },
  contacted: { label: "Contacted", color: "#0369a1", bg: "#e0f2fe", icon: MessageSquare },
  arranged:  { label: "Arranged",  color: "#b45309", bg: "#fef3c7", icon: Calendar },
  completed: { label: "Completed", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#b91c1c", bg: "#fee2e2", icon: XCircle },
};

const STATUS_ORDER: Status[] = ["new", "reviewing", "contacted", "arranged", "completed", "cancelled"];

const DESTINATION_FLAGS: Record<string, string> = {
  Guangzhou: "🏭",
  Foshan:    "🪑",
  Shenzhen:  "📱",
  Yiwu:      "🛍️",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as Status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6", icon: Clock };
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <cfg.icon style={{ width: 10, height: 10 }} />
      {cfg.label}
    </span>
  );
}

function TravelCard({ req, onStatusChange, isUpdating }: {
  req: TravelRequest;
  onStatusChange: (id: string, status: Status) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(req.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  const flag = DESTINATION_FLAGS[req.destination] ?? "✈️";

  const nextStatuses = STATUS_ORDER.filter((s) => s !== req.status);

  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Card top bar — destination colour strip */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #1a2540 0%, #d4af37 100%)" }} />

      <div style={{ padding: "16px 20px" }}>
        {/* Row 1: name + status + date */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {flag}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>{req.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin style={{ width: 11, height: 11 }} />
                {req.destination}
                {req.travelDates && <> · <Calendar style={{ width: 11, height: 11 }} /> {req.travelDates}</>}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusBadge status={req.status} />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{date}</span>
          </div>
        </div>

        {/* Row 2: contact details */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
            <Mail style={{ width: 12, height: 12, color: "#6b7280" }} /> {req.email}
          </span>
          {req.phone && (
            <span style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
              <Phone style={{ width: 12, height: 12, color: "#6b7280" }} /> {req.phone}
            </span>
          )}
        </div>

        {/* Expandable details */}
        {(req.details || req.message) && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              <ChevronDown style={{ width: 13, height: 13, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              {expanded ? "Hide details" : "View trip details"}
            </button>
            {expanded && (
              <div style={{ marginTop: 10, background: "#f9fafb", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#374151", lineHeight: 1.6, borderLeft: "3px solid #d4af37" }}>
                {req.details || req.message}
              </div>
            )}
          </>
        )}

        {/* Status actions */}
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 2 }}>Update status:</span>
          {nextStatuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                disabled={isUpdating}
                onClick={() => onStatusChange(req.id, s)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: cfg.bg, color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.6 : 1,
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TravelRequestsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-travel-requests"],
    queryFn: adminApi.getTravelRequests,
    refetchInterval: 30_000,
  });

  const requests = data?.travelRequests ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      adminApi.updateTravelRequest(id, status),
    onSuccess: (_, vars) => {
      toast.success(`Marked as ${STATUS_CONFIG[vars.status]?.label ?? vars.status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-travel-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update status."),
  });

  const filtered = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  // Stats
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = requests.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const topDestinations = Object.entries(
    requests.reduce((acc, r) => { acc[r.destination] = (acc[r.destination] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-gold" /> China Travel Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer trip inquiries — from first contact to fully arranged.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              style={{
                background: filterStatus === s ? cfg.bg : "#fff",
                border: `1.5px solid ${filterStatus === s ? cfg.color : "#e5e7eb"}`,
                borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
              }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: cfg.color }}>{counts[s] || 0}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Destination summary */}
      {topDestinations.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {topDestinations.map(([dest, count]) => (
            <div key={dest} style={{ background: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{DESTINATION_FLAGS[dest] ?? "✈️"}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#111827" }}>{dest}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{count} request{count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading / Error */}
      {isLoading && (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading travel requests…</CardContent></Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load travel requests.</CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && requests.length === 0 && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Luggage style={{ width: 28, height: 28, color: "#d4af37" }} />
            </div>
            <div>
              <p className="font-semibold font-display text-lg">No travel requests yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                When customers submit a trip inquiry from the storefront, it will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter label */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filterStatus === "all"
              ? `All ${requests.length} request${requests.length !== 1 ? "s" : ""}`
              : `${filtered.length} ${STATUS_CONFIG[filterStatus]?.label} request${filtered.length !== 1 ? "s" : ""}`}
          </p>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((req) => (
            <TravelCard
              key={req.id}
              req={req}
              isUpdating={updateMutation.isPending}
              onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && requests.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No requests with status "{STATUS_CONFIG[filterStatus as Status]?.label}".
          </CardContent>
        </Card>
      )}
    </div>
  );
}
