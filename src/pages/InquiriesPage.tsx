import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi, type InquiryRecord } from "@/lib/api";
import { toast } from "sonner";
import { Mail, Phone, MessageSquare, CalendarDays, MapPin, Package } from "lucide-react";

const STATUS_OPTIONS = ["new", "reviewing", "contacted", "quoted", "resolved", "closed"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-200",
  reviewing: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  contacted: "bg-purple-500/10 text-purple-600 border-purple-200",
  quoted: "bg-orange-500/10 text-orange-600 border-orange-200",
  resolved: "bg-green-500/10 text-green-600 border-green-200",
  closed: "bg-gray-500/10 text-gray-500 border-gray-200",
};

const KIND_COLORS: Record<string, string> = {
  contact: "bg-blue-500/10 text-blue-700",
  sourcing: "bg-amber-500/10 text-amber-700",
  travel: "bg-teal-500/10 text-teal-700",
};

export default function InquiriesPage() {
  const queryClient = useQueryClient();
  const [draftStatuses, setDraftStatuses] = useState<Record<string, InquiryRecord["status"]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: adminApi.inquiries,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: typeof STATUS_OPTIONS[number] }) =>
      adminApi.updateInquiryStatus(id, status),
    onSuccess: (_, { id, status }) => {
      toast.success(`Inquiry marked as ${status}.`);
      setDraftStatuses((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update inquiry."),
  });

  const inquiries = data?.inquiries || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Inquiries</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track contact messages, sourcing requests, and travel assistance leads.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <MessageSquare className="h-4 w-4" />
          {inquiries.length} total
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load inquiries right now.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && inquiries.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No inquiries have been submitted yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Messages from the contact form will appear here.</p>
        </div>
      )}

      {/* Inquiry Cards */}
      {!isLoading && inquiries.length > 0 && (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => {
            const selectedStatus = draftStatuses[inquiry.id] || inquiry.status;
            const hasPendingChange = selectedStatus !== inquiry.status;
            const isExpanded = expanded[inquiry.id] || false;

            return (
              <div
                key={inquiry.id}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 p-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                      {inquiry.name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{inquiry.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${KIND_COLORS[inquiry.kind] || KIND_COLORS.contact}`}
                        >
                          {inquiry.kind}
                        </span>
                        {inquiry.subject && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {inquiry.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge + Date */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[inquiry.status] || STATUS_COLORS.new}`}
                    >
                      {inquiry.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inquiry.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="px-4 pb-3">
                  <p className={`text-sm text-muted-foreground leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                    {inquiry.message}
                  </p>
                  {inquiry.message && inquiry.message.length > 120 && (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [inquiry.id]: !prev[inquiry.id] }))}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {/* Meta Info Row */}
                <div className="px-4 pb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[180px]">{inquiry.email}</span>
                  </span>
                  {inquiry.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      {inquiry.phone}
                    </span>
                  )}
                  {inquiry.productInterest && (
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      {inquiry.productInterest}
                    </span>
                  )}
                  {inquiry.destination && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {inquiry.destination}
                      {inquiry.travelDates && ` · ${inquiry.travelDates}`}
                    </span>
                  )}
                </div>

                {/* Action Row */}
                <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-muted/30 rounded-b-xl">
                  <label className="text-xs text-muted-foreground mr-1">Update status:</label>
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setDraftStatuses((prev) => ({
                        ...prev,
                        [inquiry.id]: event.target.value as InquiryRecord["status"],
                      }))
                    }
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs capitalize flex-1 max-w-[160px]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant={hasPendingChange ? "default" : "outline"}
                    className={`h-8 px-4 text-xs ${hasPendingChange ? "bg-primary text-primary-foreground" : ""}`}
                    disabled={!hasPendingChange || updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        id: inquiry.id,
                        status: selectedStatus as typeof STATUS_OPTIONS[number],
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
