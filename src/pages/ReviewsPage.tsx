import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

type Review = {
  id: string;
  productName?: string | null;
  customerName: string;
  rating: number;
  body: string;
  status: string;
  createdAt: string;
};

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: adminApi.reviews,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      adminApi.updateReviewStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Review ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update review."),
  });

  const reviews = (data?.reviews as Review[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Reviews</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor customer feedback for products and service quality.</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading reviews...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load reviews right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length ? (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.productName || "Product"}</TableCell>
                    <TableCell>{review.customerName}</TableCell>
                    <TableCell>{review.rating}/5</TableCell>
                    <TableCell><Badge variant="secondary">{review.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{review.body}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell>
                      {review.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-white hover:bg-success/90 h-7 px-2 text-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: review.id, status: "approved" })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: review.id, status: "rejected" })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {review.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: review.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      )}
                      {review.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: review.id, status: "approved" })}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No reviews found.
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
