import React from "react";
import { Plus, Package } from "lucide-react";
import { Product } from "../types";
import { Language, getProductField, getTranslation } from "../lib/translations";

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
  onFastAdd: () => void;
  lang: Language;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpen, onFastAdd, lang }) => {
  const hasVariants = product.options?.length > 0 && product.variants?.length > 0;
  
  // Calculate total stock and price ranges
  const totalStock = hasVariants
    ? product.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)
    : (product.stock ?? 0);
    
  const isSoldOut = totalStock <= 0;
  const isLowStock = !isSoldOut && totalStock <= 3;

  const prices = hasVariants ? product.variants.map((v) => v.price) : [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const priceDisplay = minPrice === maxPrice 
    ? `$${minPrice.toFixed(2)}` 
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={onOpen}
      className={`bg-white border border-gray-200/80 rounded-3xl p-4 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition duration-200 cursor-pointer relative group overflow-hidden ${isSoldOut ? "opacity-75 grayscale-20" : ""}`}
    >
      {/* Badges */}
      {isSoldOut ? (
        <div 
          id={`sold-out-badge-${product.id}`}
          className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase z-10 shadow-sm animate-fade-in"
        >
          {getTranslation(lang, "sold_out")}
        </div>
      ) : isLowStock ? (
        <div 
          id={`low-stock-badge-${product.id}`}
          className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase z-10 shadow-sm animate-pulse"
        >
          {lang === "ar" ? "كمية محدودة" : "LOW STOCK"}
        </div>
      ) : null}

      {/* Image container */}
      <div 
        id={`product-img-container-${product.id}`}
        className="bg-gray-50 rounded-2xl h-36 flex items-center justify-center mb-4 overflow-hidden border border-gray-100 relative"
      >
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={getProductField(lang, product, "name")}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            referrerPolicy="no-referrer"
          />
        ) : product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={getProductField(lang, product, "name")}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={32} className="text-gray-300" />
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span 
            id={`product-category-${product.id}`}
            className="text-[10px] uppercase tracking-widest font-black text-gray-400 block mb-1"
          >
            {getProductField(lang, product, "category")}
          </span>
          <h3 
            id={`product-name-${product.id}`}
            className="text-sm font-black text-[#0F172A] leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-black transition"
          >
            {getProductField(lang, product, "name")}
          </h3>
          {hasVariants && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1 block">
              {lang === "ar" ? `متوفر ${product.variants.length} خيارات` : `${product.variants.length} Options Available`}
            </span>
          )}
        </div>

        {/* Footer info & Fast Add */}
        <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block leading-none">
              {lang === "ar" ? "السعر" : "Price"}
            </span>
            <span 
              id={`product-price-${product.id}`}
              className="text-base font-black text-[#0F172A] mt-1 block"
            >
              {priceDisplay}
            </span>
          </div>

          <button
            id={`fast-add-btn-${product.id}`}
            type="button"
            disabled={isSoldOut}
            onClick={(e) => {
              e.stopPropagation();
              if (!isSoldOut) onFastAdd();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
              isSoldOut
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-[#0F172A] hover:bg-slate-800 text-white active:scale-95 shadow-sm"
            }`}
          >
            <Plus size={12} strokeWidth={3} />
            <span>{lang === "ar" ? "أضف" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
