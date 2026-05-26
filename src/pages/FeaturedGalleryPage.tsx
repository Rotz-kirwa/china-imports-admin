import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Images } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

export default function FeaturedGalleryPage() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-featured-gallery"],
    queryFn: adminApi.getFeaturedGallery,
  });

  const items = data?.items ?? [];

  const addMutation = useMutation({
    mutationFn: (imageUrl: string) => adminApi.addFeaturedGalleryItem(imageUrl),
    onSuccess: () => {
      toast.success("Image added to featured gallery.");
      setUrl("");
      setPreview("");
      queryClient.invalidateQueries({ queryKey: ["admin-featured-gallery"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add image."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFeaturedGalleryItem(id),
    onSuccess: () => {
      toast.success("Image removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-featured-gallery"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove image."),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    addMutation.mutate(url.trim());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Featured Gallery</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the image gallery shown on the home page. Add or remove images freely — they are not linked to any shop product.
        </p>
      </div>

      {/* Add image form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-gold" /> Add New Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  required
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setPreview(e.target.value);
                  }}
                  placeholder="https://i.pinimg.com/…"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={addMutation.isPending || !url.trim()}
                  className="bg-gold text-accent-foreground hover:bg-gold/90"
                >
                  {addMutation.isPending ? "Adding…" : "Add Image"}
                </Button>
              </div>
            </div>

            {/* Live preview */}
            {preview && (
              <div className="flex items-center gap-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover border border-border bg-muted"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  onLoad={(e) => (e.currentTarget.style.display = "block")}
                />
                <p className="text-xs text-muted-foreground">Preview</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Gallery grid */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Images className="h-4 w-4 text-gold" />
            Current Gallery
            <span className="text-xs font-normal text-muted-foreground ml-1">({items.length} image{items.length !== 1 ? "s" : ""})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground py-4">Loading gallery…</p>}
          {error && <p className="text-sm text-destructive py-4">Unable to load gallery.</p>}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Images className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No images yet. Add your first one above.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="group relative rounded-lg overflow-hidden border border-border bg-muted aspect-square">
                <img
                  src={item.imageUrl}
                  alt={`Gallery item ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Position badge */}
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
