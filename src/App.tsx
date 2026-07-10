import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  LayoutDashboard,
  Search,
  ShoppingCart,
  Phone,
  Instagram,
  MapPin,
  X,
  Package,
  Layers,
  Truck,
  Settings,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";

// Types & Initial Data
import { Product, CartItem, Order, StoreSettings } from "./types";
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from "./data";

// Localization Helpers
import { Language, translations, getTranslation, getProductField, getStoreField } from "./lib/translations";

// Role-Based Auth Helpers
import { User, checkPermission, ROLE_LABELS } from "./lib/auth";
import { addSecurityLog } from "./lib/security";

// Shared SVG WhatsApp Icon
import { WAIcon } from "./components/WAIcon";

// Modular Components
import { PasswordModal } from "./components/PasswordModal";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { AdminKPIs } from "./components/AdminKPIs";
import { ProductForm } from "./components/ProductForm";
import { ManageProducts } from "./components/ManageProducts";
import { OrdersTab } from "./components/OrdersTab";
import { SettingsTab } from "./components/SettingsTab";
import { UsersTab } from "./components/UsersTab";

export default function App() {
  // Core application states with localStorage persistence
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem("alaa_store_language");
    return (stored === "ar" || stored === "en") ? stored : "en";
  });

  const handleLanguageSwitch = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("alaa_store_language", newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("alaa_store_products");
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem("alaa_store_orders");
    return stored ? JSON.parse(stored) : [];
  });
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const stored = localStorage.getItem("alaa_store_settings");
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  // Navigation states & RBAC
  const [currentView, setCurrentView] = useState<"storefront" | "admin">("storefront");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("alaa_store_current_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"products" | "orders" | "settings" | "users">("products");

  const isAdminAuthenticated = currentUser !== null;

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem("alaa_store_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("alaa_store_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("alaa_store_settings", JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("alaa_store_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("alaa_store_current_user");
    }
  }, [currentUser]);

  // High-Security: Session Inactivity Handler (Auto-logout after 10 minutes)
  useEffect(() => {
    if (!currentUser) return;

    let lastActiveTime = Date.now();
    const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes of complete inactivity

    const handleActivity = () => {
      lastActiveTime = Date.now();
    };

    // User activity events to monitor
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const intervalId = setInterval(() => {
      const inactiveTime = Date.now() - lastActiveTime;
      if (inactiveTime >= TIMEOUT_DURATION) {
        addSecurityLog(
          "SESSION_TIMEOUT",
          currentUser.username,
          `Session terminated automatically after ${TIMEOUT_DURATION / (60 * 1000)} minutes of inactivity`
        );
        setCurrentUser(null);
        setCurrentView("storefront");
        showToast("Admin session expired due to inactivity.", "error");
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);

  // Active modal/popup states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    setToastTimer(timer);
  };

  // Switch View Trigger with Authentication Lock
  const handleViewSwitch = (view: "storefront" | "admin") => {
    if (view === "admin") {
      if (isAdminAuthenticated) {
        setCurrentView("admin");
      } else {
        setShowPasswordModal(true);
      }
    } else {
      setCurrentView("storefront");
    }
  };

  // High-Security Account Deletion Trigger
  const handleDeleteStoreAccount = () => {
    // 1. Permanently remove account profile from registered users in localStorage
    if (currentUser) {
      const storedUsers = localStorage.getItem("alaa_store_users");
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          const filteredUsers = parsedUsers.filter((u: any) => u.id !== currentUser.id);
          localStorage.setItem("alaa_store_users", JSON.stringify(filteredUsers));
        } catch (e) {
          console.error("Error filtering users:", e);
        }
      }
    }

    // 2. Remove all local storage variables associated with the store
    localStorage.removeItem("alaa_store_products");
    localStorage.removeItem("alaa_store_orders");
    localStorage.removeItem("alaa_store_settings");
    localStorage.removeItem("alaa_store_current_user");

    // 3. Reset states to initial blank or default values
    setProducts([]);
    setOrders([]);
    setStoreSettings(DEFAULT_SETTINGS);
    setCart({});

    // 4. Redirect to secure logged out storefront state
    setCurrentUser(null);
    setCurrentView("storefront");
    setActiveAdminTab("products");

    showToast("Store account permanently deleted. All databases wiped.", "success");
  };

  // Add Item to Shopping Cart
  const handleAddToCart = (productId: string, variantId: string, name: string, variantLabel: string, price: number, qty: number) => {
    const cartKey = `${productId}::${variantId}`;
    setCart((prev) => {
      const existing = prev[cartKey];
      if (existing) {
        return {
          ...prev,
          [cartKey]: {
            ...existing,
            qty: existing.qty + qty,
          },
        };
      } else {
        return {
          ...prev,
          [cartKey]: {
            productId,
            variantId,
            name,
            variantLabel,
            price,
            qty,
          },
        };
      }
    });
  };

  // Calculate cart metrics
  const cartKeys = Object.keys(cart);
  const cartItemCount = cartKeys.reduce((sum, k) => sum + cart[k].qty, 0);
  const cartSubtotal = cartKeys.reduce((sum, k) => sum + cart[k].qty * cart[k].price, 0);

  // Filter products for storefront
  const getFilteredProducts = () => {
    return products.filter((p) => {
      // Visibility guard
      if (p.visible === false) return false;

      // Category filter
      if (selectedCategory !== "All Categories" && p.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (
        searchQuery.trim() &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Out of Stock filter
      if (hideOutOfStock) {
        const hasVariants = p.options?.length > 0 && p.variants?.length > 0;
        const totalStock = hasVariants
          ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : (p.stock ?? 0);
        if (totalStock <= 0) return false;
      }

      return true;
    });
  };

  const filteredProducts = getFilteredProducts();

  // Distinct list of categories for storefront horizontal filter
  const storefrontCategories: string[] = ["All Categories", ...Array.from(new Set<string>(products.filter(p => p.visible !== false).map((p) => p.category)))];

  return (
    <div className="min-h-screen bg-[#F3F4F6] md:py-8 flex items-start justify-center font-sans antialiased text-[#111827]">
      {/* Centered Mobile Browser Simulator Frame */}
      <div 
        id="app-simulator-container"
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="w-full max-w-md bg-white shadow-2xl min-h-screen md:min-h-[820px] md:rounded-[32px] overflow-hidden relative border border-gray-200 flex flex-col justify-between"
      >
        {/* Core Header (Dark Theme Header as requested) */}
        <header 
          id="main-app-header"
          className="bg-[#0F172A] text-white pt-4 pb-3 px-4 sticky top-0 z-40 border-b border-white/10 shadow-md shrink-0 animate-fade-in"
        >
          {/* Top Brand & View Toggle Switch & Language Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-3">
              {/* Store Branding Logo */}
              <div className="flex items-center gap-2.5 min-w-0">
                {storeSettings.profilePicUrl ? (
                  <img
                    src={storeSettings.profilePicUrl}
                    alt={getStoreField(lang, storeSettings, "title")}
                    className="w-8 h-8 rounded-xl object-cover border-2 border-white/20 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-white text-[#0F172A] font-black text-xs px-2.5 py-1.5 rounded-xl shrink-0 flex items-center justify-center leading-none tracking-tighter shadow-md border border-white/20">
                    ON
                  </div>
                )}
                <h2 className="text-sm font-black tracking-tighter truncate uppercase text-white">
                  {getStoreField(lang, storeSettings, "title")}
                </h2>
              </div>

              {/* Split Mode Toggle Switch */}
              <div 
                id="navigation-mode-toggle"
                className="bg-white/10 p-1 rounded-full flex items-center border border-white/10 shadow-inner shrink-0"
              >
                <button
                  id="toggle-view-storefront"
                  type="button"
                  onClick={() => handleViewSwitch("storefront")}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    currentView === "storefront"
                      ? "bg-white text-[#0F172A] shadow-md font-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <ShoppingBag size={9} strokeWidth={2.5} />
                  <span>{getTranslation(lang, "store")}</span>
                </button>
                <button
                  id="toggle-view-admin"
                  type="button"
                  onClick={() => handleViewSwitch("admin")}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    currentView === "admin"
                      ? "bg-white text-[#0F172A] shadow-md font-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <LayoutDashboard size={9} strokeWidth={2.5} />
                  <span>{getTranslation(lang, "admin")}</span>
                </button>
              </div>
            </div>

            {/* Tactile 3D Language Selector Pill (Maintains High-End Tech/Tactile 2026 finish) */}
            <div className="flex justify-between items-center bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-2xl shadow-[inset_0px_1px_2px_rgba(0,0,0,0.4)]">
              <span className="text-[8px] font-black tracking-widest text-white/50 uppercase">
                {lang === "ar" ? "اللغة النشطة" : "Active Language"}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  id="toggle-lang-en"
                  type="button"
                  onClick={() => handleLanguageSwitch("en")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all duration-200 active:scale-95 cursor-pointer border ${
                    lang === "en"
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_2px_8px_rgba(251,191,36,0.35)]"
                      : "bg-transparent text-white/60 border-transparent hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  id="toggle-lang-ar"
                  type="button"
                  onClick={() => handleLanguageSwitch("ar")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all duration-200 active:scale-95 cursor-pointer border ${
                    lang === "ar"
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_2px_8px_rgba(251,191,36,0.35)]"
                      : "bg-transparent text-white/60 border-transparent hover:text-white"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-[#F3F4F6]/60">
          <AnimatePresence mode="wait">
            {currentView === "storefront" ? (
              <motion.div
                key="storefront-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pb-24"
              >
                {/* 1. Header Branding & Banner */}
                <div 
                  id="storefront-banner"
                  className="bg-[#0F172A] text-white px-5 pb-6 pt-4 rounded-b-3xl shadow-lg relative overflow-hidden min-h-[140px] flex flex-col justify-end"
                >
                  {storeSettings.headerVideoUrl && (
                    <>
                      <video
                        src={storeSettings.headerVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                      <div className="absolute inset-0 bg-black/60 z-10" />
                    </>
                  )}

                  <div className="space-y-2.5 relative z-20">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                        {lang === "ar" ? "المتجر المباشر" : "Live Storefront"}
                      </span>
                    </div>
                    
                    <h1 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                      {getStoreField(lang, storeSettings, "title")}
                      <Sparkles size={16} className="text-amber-400 animate-pulse animate-fade-in" />
                    </h1>
                    <p className="text-xs text-slate-100 leading-relaxed font-bold uppercase tracking-wide drop-shadow-sm">
                      {getStoreField(lang, storeSettings, "description")}
                    </p>
                  </div>

                  {/* Aesthetic Background Grid Accents */}
                  {!storeSettings.headerVideoUrl && (
                    <div className="absolute right-0 bottom-0 top-0 w-32 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                  )}
                </div>

                {/* 2. Connect in Bio actionable links */}
                <div 
                  id="connect-in-bio-container"
                  className="px-4"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2.5">
                    {lang === "ar" ? "روابط سريعة" : "Connect In Bio"}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Link 1: WhatsApp Chat */}
                    <a
                      id="bio-link-whatsapp"
                      href={`https://wa.me/${storeSettings.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-50/70 hover:bg-green-100/80 border border-green-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <WAIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-green-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "تواصل مباشر" : "Chat 24/7"}
                        </span>
                        <span className="text-[8px] text-green-600 font-extrabold block mt-0.5 uppercase tracking-widest">WhatsApp</span>
                      </div>
                    </a>

                    {/* Link 2: Instagram */}
                    <a
                      id="bio-link-instagram"
                      href={`https://instagram.com/${storeSettings.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Instagram size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-indigo-950 block leading-tight uppercase tracking-tight truncate">
                          {lang === "ar" ? "انستغرام" : "Instagram"}
                        </span>
                        <span className="text-[8px] text-indigo-600 font-extrabold block mt-0.5 uppercase tracking-widest">@{storeSettings.instagram}</span>
                      </div>
                    </a>

                    {/* Link 3: Google Maps Location */}
                    <a
                      id="bio-link-location"
                      href={storeSettings.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-red-50/70 hover:bg-red-100/80 border border-red-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-red-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "موقعنا" : "Find Us"}
                        </span>
                        <span className="text-[8px] text-red-600 font-extrabold block mt-0.5 uppercase tracking-widest">Google Maps</span>
                      </div>
                    </a>

                    {/* Link 4: Call Direct Dial */}
                    <a
                      id="bio-link-call"
                      href={`tel:+${storeSettings.phone}`}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Phone size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "اتصال هاتفي" : "Call Now"}
                        </span>
                        <span className="text-[8px] text-slate-500 font-extrabold block mt-0.5 uppercase tracking-widest">Hotline LB</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* 3. Search and filter checkboxes */}
                <div 
                  id="search-filter-panel"
                  className="px-4 space-y-3"
                >
                  {/* Premium Products Search Bar */}
                  <div className="relative">
                    <input
                      id="store-search-bar"
                      type="text"
                      placeholder={lang === "ar" ? "ابحث عن منتجاتنا المميزة..." : "SEARCH PREMIUM PRODUCTS..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-black text-slate-900 placeholder-slate-400/80 shadow-sm focus:outline-none focus:ring-0 focus:border-[#0F172A] transition"
                    />
                    <Search size={14} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    {searchQuery && (
                      <button
                        id="clear-search"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Hide out of stock checkbox */}
                  <div className="flex items-center justify-between px-1">
                    <label 
                      htmlFor="hide-oos-checkbox"
                      className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer select-none"
                    >
                      <input
                        id="hide-oos-checkbox"
                        type="checkbox"
                        checked={hideOutOfStock}
                        onChange={(e) => setHideOutOfStock(e.target.checked)}
                        className="rounded border-gray-300 text-[#0F172A] focus:ring-[#0F172A] w-4 h-4 cursor-pointer"
                      />
                      <span>{lang === "ar" ? "إخفاء المنتجات المنتهية من المخزن" : "Hide out-of-stock items"}</span>
                    </label>
                  </div>
                </div>

                {/* 4. Categorization horizontal pills */}
                <div 
                  id="storefront-categories-pills"
                  className="px-4 space-y-2"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {lang === "ar" ? "أقسام المتجر" : "Product Categories"}
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {storefrontCategories.map((cat) => (
                      <button
                        key={cat}
                        id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-4.5 py-2.5 rounded-full border transition-all shadow-sm active:scale-95 ${
                          selectedCategory === cat
                            ? "bg-[#0F172A] border-[#0F172A] text-white font-black"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-bold"
                        }`}
                      >
                        {cat === "All Categories" ? (lang === "ar" ? "جميع الفئات" : "All Categories") : (lang === "ar" ? (cat === "Power bank" ? "شواحن سفري" : cat === "Shaving Machine" ? "ماكينات حلاقة" : cat === "Accessories" ? "إكسسوارات" : cat) : cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Product Grid Cards */}
                <div className="px-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                      <Package size={36} className="text-gray-300 mx-auto mb-3 opacity-50" />
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {lang === "ar" ? "لم يتم العثور على منتجات مطابقة" : "No matching products found"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1.5">
                        {lang === "ar" ? "يرجى تعديل خيارات البحث أو التصفية للقسم." : "Try adjusting your filters or search query."}
                      </p>
                    </div>
                  ) : (
                    <div 
                      id="products-grid-catalog"
                      className="grid grid-cols-2 gap-3.5"
                    >
                      {filteredProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          lang={lang}
                          onOpen={() => setSelectedProduct(prod)}
                          onFastAdd={() => {
                            if (prod.options?.length > 0) {
                              setSelectedProduct(prod);
                            } else {
                              handleAddToCart(prod.id, "base", prod.name, "", prod.basePrice, 1);
                              showToast(lang === "ar" ? `تمت إضافة "${getProductField(lang, prod, "name")}" إلى السلة` : `"${prod.name}" added to cart!`, "success");
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ADMIN DASHBOARD (Restricted route) */
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="pb-24"
              >
                {/* Visual stats and widgets inside dark container */}
                <div className="bg-[#0F172A] text-white px-4 py-5 rounded-b-3xl space-y-4 shadow-lg">
                  <div className="flex justify-between items-start px-1 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-black uppercase tracking-tight text-white">
                          {currentUser?.fullName}
                        </h2>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-white/10 border border-white/10 text-slate-300 rounded-full tracking-wider shrink-0">
                          {currentUser?.role ? ROLE_LABELS[currentUser.role] : "Staff"}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        Active Session: {currentUser?.username}
                      </p>
                    </div>
                    <button
                      id="admin-logout"
                      type="button"
                      onClick={() => {
                        setCurrentUser(null);
                        setCurrentView("storefront");
                        showToast("Admin session disconnected");
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white bg-white/10 border border-white/15 px-3 py-1 rounded-xl transition active:scale-95 shadow-sm cursor-pointer shrink-0"
                    >
                      Log Out
                    </button>
                  </div>

                  {/* 1. KPIs real-time stats overview */}
                  <AdminKPIs products={products} orders={orders} />
                </div>

                {/* Admin Tab select navigation */}
                <div 
                  id="admin-tabs-nav"
                  className="px-4 mt-4"
                >
                  <div className="bg-white border-2 border-gray-200 p-1 rounded-2xl flex flex-wrap items-center shadow-sm gap-1">
                    {currentUser && checkPermission(currentUser, "manage_products") && (
                      <button
                        id="admin-tab-products"
                        type="button"
                        onClick={() => setActiveAdminTab("products")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "products"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Package size={11} strokeWidth={2.5} />
                        <span>Products</span>
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_orders") && (
                      <button
                        id="admin-tab-orders"
                        type="button"
                        onClick={() => setActiveAdminTab("orders")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
                          activeAdminTab === "orders"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Truck size={11} strokeWidth={2.5} />
                        <span>Orders</span>
                        {orders.filter((o) => o.status === "Pending").length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm animate-pulse">
                            {orders.filter((o) => o.status === "Pending").length}
                          </span>
                        )}
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_settings") && (
                      <button
                        id="admin-tab-settings"
                        type="button"
                        onClick={() => setActiveAdminTab("settings")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "settings"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Settings size={11} strokeWidth={2.5} />
                        <span>Customizer</span>
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_users") && (
                      <button
                        id="admin-tab-users"
                        type="button"
                        onClick={() => setActiveAdminTab("users")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "users"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Users size={11} strokeWidth={2.5} />
                        <span>Team</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inner Tab contents */}
                <div className="p-4 space-y-4">
                  {activeAdminTab === "products" && currentUser && checkPermission(currentUser, "manage_products") && (
                    <div className="space-y-4">
                      {/* Products form and inventory list */}
                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                        <ProductForm
                          products={products}
                          setProducts={setProducts}
                          showToast={showToast}
                          onSuccess={() => {}}
                        />
                      </div>

                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
                        <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest block">
                          Current Catalog Listings
                        </span>
                        <ManageProducts
                          products={products}
                          setProducts={setProducts}
                          showToast={showToast}
                        />
                      </div>
                    </div>
                  )}

                  {activeAdminTab === "orders" && currentUser && checkPermission(currentUser, "manage_orders") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <OrdersTab orders={orders} setOrders={setOrders} />
                    </div>
                  )}

                  {activeAdminTab === "settings" && currentUser && checkPermission(currentUser, "manage_settings") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <SettingsTab
                        settings={storeSettings}
                        setSettings={setStoreSettings}
                        showToast={showToast}
                        onDeleteAccount={handleDeleteStoreAccount}
                        currentUser={currentUser}
                        products={products}
                        setProducts={setProducts}
                        orders={orders}
                      />
                    </div>
                  )}

                  {activeAdminTab === "users" && currentUser && checkPermission(currentUser, "manage_users") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <UsersTab currentUser={currentUser} showToast={showToast} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Dynamic Floating Cart Sticky bar for storefront users */}
        {currentView === "storefront" && cartItemCount > 0 && (
          <div 
            id="floating-checkout-indicator"
            className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] z-30 md:rounded-b-[32px]"
          >
            <button
              id="checkout-trigger-btn"
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-white text-[#0F172A] flex items-center justify-center text-[10px] font-black animate-pulse">
                  {cartItemCount}
                </div>
                <span className="text-[11px] font-black">
                  {lang === "ar" ? "معاينة السلة والطلب" : "Review Cart & Order"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-xs">
                <span>
                  {lang === "ar" ? "المجموع:" : "Subtotal:"} ${cartSubtotal.toFixed(2)}
                </span>
                <ChevronRight size={14} className="stroke-3" />
              </div>
            </button>
          </div>
        )}

        {/* Footer copyright block */}
        <footer 
          id="global-branding-footer"
          className="bg-[#0F172A] border-t border-white/5 py-4.5 px-4 text-center shrink-0 z-10"
        >
          <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-none">
            © 2026 ON ALAA STORE. {lang === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1.5">
            {lang === "ar" ? "مشغل بواسطة محرك علاء التجاري" : "Powered by ALAA E-Commerce Engine"}
          </p>
        </footer>

        {/* 1. Modal overlay: Password authentication Gate */}
        {showPasswordModal && (
          <PasswordModal
            onClose={() => {
              setShowPasswordModal(false);
              showToast("Authentication cancelled", "error");
            }}
            onSuccess={(user) => {
              setCurrentUser(user);
              setShowPasswordModal(false);
              setCurrentView("admin");
              
              // Set the default tab according to user permissions
              if (user.role === "dispatcher") {
                setActiveAdminTab("orders");
              } else {
                setActiveAdminTab("products");
              }
              
              showToast(`Access granted: ${user.fullName}`, "success");
            }}
          />
        )}

        {/* 2. Modal overlay: Product details selector */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            lang={lang}
            onClose={() => setSelectedProduct(null)}
            onAdd={(vId, vLabel, price, qty) => {
              handleAddToCart(
                selectedProduct.id,
                vId,
                selectedProduct.name,
                vLabel,
                price,
                qty
              );
              showToast(lang === "ar" ? `تمت إضافة "${getProductField(lang, selectedProduct, "name")}" إلى السلة` : `"${selectedProduct.name}" added to cart!`, "success");
              setSelectedProduct(null);
            }}
          />
        )}

        {/* 3. Modal overlay: Final Checkout form */}
        {isCheckoutOpen && (
          <CheckoutModal
            cart={cart}
            setCart={setCart}
            products={products}
            onClose={() => setIsCheckoutOpen(false)}
            onOrder={(order) => {
              setOrders((prev) => [order, ...prev]);
            }}
            showToast={showToast}
            storeSettings={storeSettings}
            lang={lang}
          />
        )}
      </div>

      {/* Instant visual toast notify rendering */}
      {toast && (
        <div 
          id="global-toast-notification"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-4 py-3 rounded-xl shadow-xl text-xs font-bold tracking-wide flex items-center gap-2 border animate-slide-down ${
            toast.type === "error"
              ? "bg-red-900 border-red-800 text-red-200"
              : "bg-slate-900 border-slate-800 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
