import React from "react";
import { Eye, EyeOff, Trash2, Package, RefreshCw, Layers } from "lucide-react";
import { Product } from "../types";

interface ManageProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export const ManageProducts: React.FC<ManageProductsProps> = ({
  products,
  setProducts,
  showToast,
}) => {
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  const handleToggleVisibility = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: p.visible === false ? true : false } : p))
    );
    showToast("Product visibility updated!");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    showToast(`Deleted "${deleteTarget.name}" successfully!`, "success");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-3.5">
      {products.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
          <Package size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-black text-slate-500">Your inventory is currently empty</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Go to 'Add Product' to start building listings.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => {
            const hasVariants = p.options?.length > 0 && p.variants?.length > 0;
            const totalStock = hasVariants
              ? p.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)
              : (p.stock ?? 0);

            const prices = hasVariants ? p.variants.map((v) => v.price) : [p.basePrice];
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceDisplay = minPrice === maxPrice 
              ? `$${minPrice.toFixed(2)}` 
              : `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`;

            const isOos = totalStock <= 0;
            const isLow = !isOos && totalStock <= 3;

            return (
              <div
                key={p.id}
                id={`manage-item-${p.id}`}
                className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-slate-200 transition"
              >
                {/* Product mini avatar */}
                <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {p.imageUrls && p.imageUrls.length > 0 ? (
                    <img
                      src={p.imageUrls[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package size={18} className="text-slate-300" />
                  )}
                </div>

                {/* Details info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-800 truncate leading-tight">
                    {p.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 px-1.5 py-0.25 rounded border border-slate-100">
                      {p.category}
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold">{priceDisplay}</span>
                    <span className="text-[9px] text-slate-300">•</span>
                    {isOos ? (
                      <span className="text-[9px] font-bold text-red-600">OOS</span>
                    ) : isLow ? (
                      <span className="text-[9px] font-bold text-amber-600">{totalStock} Left</span>
                    ) : (
                      <span className="text-[9px] font-bold text-green-600">{totalStock} Units</span>
                    )}
                  </div>
                </div>

                {/* Quick Toggle Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id={`toggle-vis-${p.id}`}
                    type="button"
                    onClick={() => handleToggleVisibility(p.id)}
                    className={`p-1.5 rounded-lg border transition ${
                      p.visible !== false
                        ? "border-green-100 text-green-600 bg-green-50"
                        : "border-slate-200 text-slate-400 bg-slate-50"
                    }`}
                  >
                    {p.visible !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    id={`delete-prod-${p.id}`}
                    type="button"
                    onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0F172A] rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Confirm Product Deletion
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Are you sure you want to permanently delete <strong className="text-slate-800">"{deleteTarget.name}"</strong>? This action cannot be undone and will instantly remove it from the storefront catalog.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_#000] border border-slate-900"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync footer block */}
      <button
        id="sync-sheets-btn"
        type="button"
        onClick={() => showToast("Google Sheets Sync requires OAuth Setup", "error")}
        className="w-full mt-2.5 border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-500 rounded-xl py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 transition"
      >
        <RefreshCw size={12} /> Sync Database to Google Sheets
      </button>
    </div>
  );
};
