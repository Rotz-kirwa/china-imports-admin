import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type Appointment = {
  id: string;
  customerName?: string | null;
  orderNumber?: string | null;
  slot: string;
  appointmentType: string;
  status: string;
  notes?: string | null;
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: adminApi.appointments,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" | "completed" }) =>
      adminApi.updateAppointment(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Appointment ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
    onError: () => toast.error("Failed to update appointment."),
  });

  const appointments = (data?.appointments as unknown as Appointment[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Appointments</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve, complete, or reject customer delivery and pickup requests.</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading appointments...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load appointments right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length ? (
                appointments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.customerName || "Customer"}</TableCell>
                    <TableCell className="font-mono text-xs">{item.orderNumber || "Not linked"}</TableCell>
                    <TableCell className="capitalize">{item.appointmentType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.slot).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate">{item.notes || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "approved" ? "default"
                          : item.status === "completed" ? "secondary"
                          : item.status === "rejected" ? "destructive"
                          : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-white hover:bg-success/90 h-7 px-2 text-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: item.id, status: "approved" })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: item.id, status: "rejected" })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {item.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: item.id, status: "completed" })}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {(item.status === "completed" || item.status === "rejected") && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
