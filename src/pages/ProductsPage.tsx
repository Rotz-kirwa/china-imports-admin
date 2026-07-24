import { useState, useRef } from "react";
import Papa from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, PackageSearch, Package, X, ImageIcon, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminApi } from "@/lib/api";
import { formatKsh } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: string;
  dbId: string;
  externalId?: string | null;
  name: string;
  category: string;
  sku: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number;
  moq: number;
  leadTime: string;
  image: string;
  description: string;
  stockQuantity: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  localAvailable: boolean;
  offshoreAvailable: boolean;
  inStock: boolean;
  tags: string[];
  specs: string[];
};

const CATEGORIES = [
  {
    group: "Clothing & Fashion Products",
    items: [
      "Men's official wear",
      "Hoodies",
      "Oversized T-shirts",
      "Cargo pants",
      "Tracksuits",
      "Turkish-style outfits",
      "Women's clothings",
      "Ladies handbags",
      "Jackets",
      "Children's clothes",
      "Gym wear",
      "School bags",
      "Caps & beanies",
      "Shoes",
      "Air-force style shoes",
      "Loafers",
      "Official leather shoes",
      "Timberland-style boots",
      "Ladies heels",
      "Crocs",
      "Slides/slippers",
      "School shoes",
      "Sports shoes"
    ]
  },
  {
    group: "Electronics & Accessories",
    items: [
      "Smart watches",
      "Earbuds",
      "Bluetooth speakers",
      "Power banks",
      "Phone chargers",
      "USB cables",
      "Ring lights",
      "Microphones",
      "Gaming accessories",
      "Phone covers",
      "Laptop accessories",
      "Mini projectors",
      "LED lights"
    ]
  },
  {
    group: "Home & Kitchen Products",
    items: [
      "Kitchen organizers",
      "Blenders",
      "Air fryers",
      "Electric kettles",
      "Gas burners",
      "Wall decor",
      "Curtains",
      "Bedsheets",
      "Carpets",
      "Dining sets",
      "Storage boxes",
      "Bathroom accessories"
    ]
  },
  {
    group: "Beauty & Cosmetics",
    items: [
      "Wigs",
      "Human hair",
      "Makeup kits",
      "Skincare products",
      "Nail equipment",
      "Perfumes",
      "Facial products",
      "Barber equipment",
      "Hair dryers",
      "Ring lights for salons"
    ]
  },
  {
    group: "Baby Products",
    items: [
      "Baby clothes",
      "Baby carriers",
      "Feeding sets",
      "Diaper bags",
      "Baby shoes",
      "Baby toys",
      "Walkers",
      "Baby blankets"
    ]
  },
  {
    group: "Furniture & Interior Decor",
    items: [
      "Office chairs",
      "Gaming chairs",
      "Coffee tables",
      "TV stands",
      "Wall panels",
      "Artificial plants",
      "LED mirrors",
      "Floating shelves"
    ]
  },
  {
    group: "Car Accessories",
    items: [
      "Android car screens",
      "Seat covers",
      "Car cameras",
      "LED headlights",
      "Car perfumes",
      "Phone holders",
      "Car mats",
      "Tire inflators"
    ]
  },
  {
    group: "Fitness & Sports Products",
    items: [
      "Dumbbells",
      "Resistance bands",
      "Gym gloves",
      "Yoga mats",
      "Treadmills",
      "Protein shakers"
    ]
  },
  {
    group: "Business Equipment",
    items: [
      "POS systems",
      "Barcode scanners",
      "Receipt printers",
      "CCTV systems",
      "Biometric machines",
      "Office desks",
      "Thermal printers"
    ]
  },
  {
    group: "Health & Wellness",
    items: [
      "Vitamins & Supplements",
      "Massage guns",
      "Essential oils",
      "Post-workout recovery",
      "Blood pressure monitors"
    ]
  }
];


const EMPTY_FORM = {
  name: "",
  category: "",
  sku: "",
  description: "",
  retailPrice: "",
  wholesalePrice: "",
  costPrice: "",
  moq: "1",
  leadTime: "15-25 days",
  imageUrl: "",
  stockQuantity: "0",
  lowStockThreshold: "10",
  warehouseLocation: "Main Warehouse",
  localAvailable: true,
  offshoreAvailable: true,
  tags: "",
  specs: "",
  externalId: "",
};

type FormState = typeof EMPTY_FORM;

function toPayload(f: FormState) {
  return {
    name: f.name.trim(),
    category: f.category.trim(),
    sku: f.sku.trim(),
    description: f.description.trim(),
    retailPrice: Number(f.retailPrice),
    wholesalePrice: Number(f.wholesalePrice),
    costPrice: Number(f.costPrice),
    moq: Number(f.moq),
    leadTime: f.leadTime.trim(),
    imageUrl: f.imageUrl.trim(),
    stockQuantity: Number(f.stockQuantity),
    lowStockThreshold: Number(f.lowStockThreshold),
    warehouseLocation: f.warehouseLocation.trim(),
    localAvailable: f.localAvailable,
    offshoreAvailable: f.offshoreAvailable,
    tags: f.tags ? f.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    specs: f.specs ? f.specs.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    externalId: f.externalId.trim(),
  };
}

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    sku: p.sku,
    description: p.description,
    retailPrice: String(p.retailPrice),
    wholesalePrice: String(p.wholesalePrice),
    costPrice: String(p.costPrice),
    moq: String(p.moq),
    leadTime: p.leadTime,
    imageUrl: p.image,
    stockQuantity: String(p.stockQuantity),
    lowStockThreshold: String(p.lowStockThreshold),
    warehouseLocation: p.warehouseLocation,
    localAvailable: p.localAvailable,
    offshoreAvailable: p.offshoreAvailable,
    tags: (p.tags || []).join(", "),
    specs: (p.specs || []).join("\n"),
    externalId: p.externalId || "",
  };
}

/* ─── Slide-in Form Panel ─────────────────────────────────────────── */
function ProductForm({
  editing,
  form,
  setForm,
  isSaving,
  onSubmit,
  onClose,
}: {
  editing: Product | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await adminApi.uploadImage(file);
      set("imageUrl", result.imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Full-screen dark overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={onClose}
      />

      {/* Centered modal card — solid white background, no transparency */}
      <div
        className="fixed z-50 inset-x-3 top-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] rounded-2xl flex flex-col"
        style={{ background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
      >
        {/* ── Modal header ── */}
        <div style={{ background: "#1a2540", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(212,175,55,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package style={{ width: 20, height: 20, color: "#d4af37" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#ffffff" }}>
                {editing ? "Edit Product" : "Add New Product"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                {editing ? editing.name : "Fill in all fields, then publish"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ── Scrollable form body ── */}
        <form
          onSubmit={onSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20, background: "#ffffff" }}
        >

          {/* Section: Basic Info */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8eaed" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>
              Basic Info
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="space-y-1.5">
                <Label>Product Name <span className="text-destructive">*</span></Label>
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Premium Wireless Earbuds" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <select
                    required value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 14, outline: "none" }}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>SKU <span className="text-destructive">*</span></Label>
                  <Input required value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. EAR-BT-001" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description <span className="text-destructive">*</span></Label>
                <textarea
                  required rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" }}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the product features and specs…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specifications (One per line)</Label>
                <textarea
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" }}
                  value={form.specs}
                  onChange={(e) => set("specs", e.target.value)}
                  placeholder="E.g.&#10;Bluetooth 5.0&#10;Battery life: 10 hours&#10;Waterproof IPX7"
                />
              </div>
            </div>
          </div>

          {/* Section: Image */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8eaed" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>
              Product Image
            </p>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label>Upload Image <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {isUploading && <div className="flex items-center text-sm text-muted-foreground">Uploading...</div>}
                </div>
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-gray-400">OR PROVIDE URL</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div className="space-y-1.5">
                <Label>Image URL <span className="text-destructive">*</span></Label>
                <Input required value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://i.pinimg.com/…" disabled={isUploading} />
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
              {form.imageUrl ? (
                <img
                  src={form.imageUrl} alt="Preview"
                  style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1px solid #e8eaed", background: "#f3f4f6" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 8, border: "2px dashed #d1d5db", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon style={{ width: 24, height: 24, color: "#d1d5db" }} />
                </div>
              )}
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                {form.imageUrl ? "Image preview — looks good!" : "Paste an image URL above to see a preview"}
              </p>
            </div>
          </div>

          {/* Section: Pricing */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8eaed" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>
              Pricing (KSh)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Retail <span className="text-destructive">*</span></Label>
                <Input required type="number" min="0" step="0.01" value={form.retailPrice} onChange={(e) => set("retailPrice", e.target.value)} placeholder="3500" />
              </div>
              <div className="space-y-1.5">
                <Label>Wholesale <span className="text-destructive">*</span></Label>
                <Input required type="number" min="0" step="0.01" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} placeholder="1800" />
              </div>
              <div className="space-y-1.5">
                <Label>Cost <span className="text-destructive">*</span></Label>
                <Input required type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} placeholder="1200" />
              </div>
            </div>
          </div>

          {/* Section: Inventory Control */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8eaed" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>
              Inventory Control
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock Quantity <span className="text-destructive">*</span></Label>
                <Input required type="number" min="0" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Threshold <span className="text-destructive">*</span></Label>
                <Input required type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} placeholder="10" />
              </div>
            </div>
          </div>

          {/* Section: Availability & Tags */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8eaed" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>
              Availability &amp; Tags
            </p>
            <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={form.localAvailable} onChange={(e) => set("localAvailable", e.target.checked)} style={{ accentColor: "#d4af37", width: 16, height: 16 }} />
                Local Stock (Retail)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={form.offshoreAvailable} onChange={(e) => set("offshoreAvailable", e.target.checked)} style={{ accentColor: "#d4af37", width: 16, height: 16 }} />
                Offshore (Wholesale)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold", color: "#38B2AC" }}>
                <input 
                  type="checkbox" 
                  checked={form.tags.includes("premium-badge")} 
                  onChange={(e) => {
                    const tagArray = form.tags.split(",").map(t => t.trim()).filter(Boolean);
                    if (e.target.checked) {
                      if (!tagArray.includes("premium-badge")) set("tags", [...tagArray, "premium-badge"].join(", "));
                    } else {
                      set("tags", tagArray.filter(t => t !== "premium-badge").join(", "));
                    }
                  }} 
                  style={{ accentColor: "#38B2AC", width: 16, height: 16 }} 
                />
                Show Quality Badge
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="bestseller, new, trending (comma-separated)" />
            </div>
          </div>

          {/* ── ACTION BUTTONS — always visible at the bottom of the form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 10,
                background: (isSaving || isUploading) ? "#c49b1a" : "linear-gradient(135deg, #d4af37 0%, #f0c040 100%)",
                color: "#1a1a00", fontWeight: 800, fontSize: 16,
                border: "none", cursor: (isSaving || isUploading) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(212,175,55,0.4)",
                letterSpacing: "0.01em",
              }}
            >
              {isSaving ? "Saving…" : (editing ? "💾  Save Changes" : "🚀  Publish Product")}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10,
                background: "#f3f4f6", color: "#6b7280",
                fontWeight: 600, fontSize: 14,
                border: "1px solid #e5e7eb", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ─── Bulk Upload Modal ─────────────────────────────────────────── */
function BulkUploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (products: Record<string, unknown>[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  const downloadTemplate = () => {
    const headers = "Name,Category,SKU,Description,RetailPrice,WholesalePrice,CostPrice,MOQ,LeadTime,ImageURL,StockQuantity,LowStockThreshold,WarehouseLocation,LocalAvailable,OffshoreAvailable,Tags\n";
    const sample = 'Sample Product,"Electronics & Accessories",SKU-123,"A nice description",2000,1500,1000,5,15-25 days,"https://example.com/image.jpg",50,10,"Main Warehouse",true,true,"new, featured"\n';
    const blob = new Blob([headers + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "product_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = () => {
    if (!file) return;
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedProducts = (results.data as Record<string, string>[]).map((row) => ({
            name: row.Name?.trim() || "Untitled",
            category: row.Category?.trim() || "Uncategorized",
            sku: row.SKU?.trim() || `SKU-${Math.floor(Math.random() * 100000)}`,
            description: row.Description?.trim() || "No description provided.",
            retailPrice: Number(row.RetailPrice) || 0,
            wholesalePrice: Number(row.WholesalePrice) || 0,
            costPrice: Number(row.CostPrice) || 0,
            moq: Number(row.MOQ) || 1,
            leadTime: row.LeadTime?.trim() || "15-25 days",
            imageUrl: row.ImageURL?.trim() || "",
            stockQuantity: Number(row.StockQuantity) || 0,
            lowStockThreshold: Number(row.LowStockThreshold) || 10,
            warehouseLocation: row.WarehouseLocation?.trim() || "Main Warehouse",
            localAvailable: row.LocalAvailable?.toString().toLowerCase() === "true",
            offshoreAvailable: row.OffshoreAvailable?.toString().toLowerCase() === "true",
            tags: row.Tags ? row.Tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          }));
          onUpload(parsedProducts);
        } catch {
          toast.error("Failed to parse CSV. Please check the template format.");
        } finally {
          setParsing(false);
        }
      },
      error: (error: Error) => {
        toast.error(`CSV Parsing Error: ${error.message}`);
        setParsing(false);
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.65)" }} onClick={onClose} />
      <div className="fixed z-50 inset-x-3 top-1/4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-bold text-white m-0">Bulk Upload Products</p>
              <p className="text-xs text-white/60 m-0">Upload a CSV file to add multiple products</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg border border-blue-100">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Download the template CSV.</li>
              <li>Fill in your products exactly matching the columns.</li>
              <li>Upload the CSV below. Existing SKUs will be updated!</li>
            </ul>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-3 bg-white text-blue-700 border-blue-200 hover:bg-blue-100">
              Download Template
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Select CSV File</Label>
            <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex gap-3 mt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleUpload} disabled={!file || parsing} className="flex-1 bg-gold text-black hover:bg-gold/90">
              {parsing ? "Parsing..." : "Upload & Process"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: adminApi.getProducts,
  });

  const products = (data?.products as unknown as Product[]) || [];
  const filtered = products.filter(
    (p) =>
      (filterCat === "All" || p.category === filterCat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminApi.createProduct(payload),
    onSuccess: () => {
      toast.success("Product added to catalogue.");
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add product."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminApi.updateProduct(id, payload),
    onSuccess: () => {
      toast.success("Product updated.");
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });

    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update product."),
  });

  const bulkMutation = useMutation({
    mutationFn: (products: Record<string, unknown>[]) => adminApi.bulkCreateProducts(products),
    onSuccess: () => {
      toast.success("Bulk upload successful.");
      setBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to bulk upload products."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product removed from catalogue.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });

    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove product."),
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm(productToForm(p));
    setPanelOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(form);
    if (editing) {
      updateMutation.mutate({ id: editing.dbId || editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add, edit, and remove products from the catalogue.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setBulkOpen(true)}
            size="lg"
            variant="outline"
            className="shadow-sm gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload CSV
          </Button>
          <Button
            onClick={openAdd}
            size="lg"
            className="bg-gold text-accent-foreground hover:bg-gold/90 shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Quick-action banner when catalogue is empty */}
      {!isLoading && !error && products.length === 0 && (
        <Card className="border-2 border-dashed border-gold/30 bg-gold/5">
          <CardContent className="py-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-gold" />
            </div>
            <div>
              <p className="font-display font-semibold text-lg">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Start building your catalogue — add your first product and it will appear on the storefront.
              </p>
            </div>
            <Button onClick={openAdd} className="bg-gold text-accent-foreground hover:bg-gold/90 gap-2">
              <Plus className="h-4 w-4" /> Add First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Category Filters */}
      {products.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name, category, or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-sm text-muted-foreground">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["All", ...Array.from(new Set(products.map((p) => p.category))).sort()].map((cat) => {
              const count =
                cat === "All"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              const active = filterCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-gold text-accent-foreground border-gold"
                      : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
                  }`}
                >
                  {cat} <span className="opacity-60 ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading products…</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load products.</CardContent>
        </Card>
      )}

      {/* Product Table */}
      {!isLoading && products.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base">Product Catalogue</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={openAdd}
              className="gap-1.5 border-gold/40 text-gold hover:bg-gold/5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Retail</TableHead>
                  <TableHead>Wholesale</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length ? (
                  filtered.map((p) => (
                    <TableRow key={p.dbId || p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm leading-tight">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                      <TableCell className="font-semibold text-sm">{formatKsh(p.retailPrice)}</TableCell>
                      <TableCell className="text-sm">{formatKsh(p.wholesalePrice)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatKsh(p.costPrice)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.localAvailable && (
                            <Badge variant="secondary" className="text-[10px]">Retail</Badge>
                          )}
                          {p.offshoreAvailable && (
                            <Badge variant="outline" className="text-[10px]">Wholesale</Badge>
                          )}
                          {!p.inStock && (
                            <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs gap-1"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      {search
                        ? "No products match your search."
                        : "No products in this category."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Slide-in Add / Edit Panel */}
      {panelOpen && (
        <ProductForm
          editing={editing}
          form={form}
          setForm={setForm}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* Bulk Upload Modal */}
      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onUpload={(products) => bulkMutation.mutate(products)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this product?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently removed from the catalogue
              and will no longer appear on the storefront. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.dbId || deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Yes, Remove Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
