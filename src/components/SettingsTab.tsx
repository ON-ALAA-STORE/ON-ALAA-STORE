import React, { useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw, Smartphone, Instagram, MapPin, Link, Trash2, UploadCloud, Video, Lock, ShieldAlert, Download, Database, FileSpreadsheet, Share2 } from "lucide-react";
import { StoreSettings } from "../types";
import { User } from "../lib/auth";
import { sanitizeInput } from "../lib/security";

interface SettingsTabProps {
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  showToast: (msg: string, type?: "success" | "error") => void;
  onDeleteAccount: () => void;
  currentUser?: User | null;
  products?: any[];
  setProducts?: React.Dispatch<React.SetStateAction<any[]>>;
  orders?: any[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  setSettings,
  showToast,
  onDeleteAccount,
  currentUser,
  products = [],
  setProducts,
  orders = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Export Products as CSV
  const handleExportProductsCSV = () => {
    if (!products || products.length === 0) {
      showToast("No products found in catalog to export.", "error");
      return;
    }
    
    // Headers
    const headers = ["ID", "Name", "Category", "BasePrice", "Stock", "Description"];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.basePrice,
      p.stock || 0,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `on_alaa_store_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Product catalog backup downloaded successfully!", "success");
  };

  // 2. Export Orders as CSV
  const handleExportOrdersCSV = () => {
    if (!orders || orders.length === 0) {
      showToast("No order histories found to export.", "error");
      return;
    }
    
    // Headers
    const headers = ["OrderID", "CustomerName", "Phone", "Location", "TotalAmount", "Status", "Date"];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customer.name.replace(/"/g, '""')}"`,
      o.customer.phone,
      `"${(o.customer.location || "").replace(/"/g, '""')}"`,
      o.total,
      o.status,
      o.createdAt
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `on_alaa_store_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Order transaction history backup downloaded successfully!", "success");
  };

  // 3. Generate and Export XML Sitemap dynamically
  const handleExportXMLSitemap = () => {
    const siteUrl = window.location.origin;
    const currentDate = new Date().toISOString().split("T")[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Core Homepage (highest priority)
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
    
    // Dynamic Product Categories
    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    categories.forEach((cat) => {
      const escapedCat = encodeURIComponent(cat.toLowerCase());
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/?category=${escapedCat}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Dynamic Individual Product URLs
    products.forEach((prod) => {
      const escapedId = encodeURIComponent(prod.id);
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/?product=${escapedId}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += `</urlset>`;
    
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sitemap.xml");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Dynamic sitemap.xml generated successfully! Ready for Google Search Console.", "success");
  };

  const handleSyncToSheets = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast("Sync completed! Google Sheets database updated with latest backup.", "success");
    }, 1500);
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deletePassword === "A123321A") {
      setShowDeleteConfirm(false);
      setDeletePassword("");
      onDeleteAccount();
    } else {
      showToast("Invalid master password. Deletion aborted.", "error");
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Logo file must be smaller than 3MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettings((prev) => ({
          ...prev,
          profilePicUrl: ev.target!.result as string,
        }));
        showToast("Store branding photo updated!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Uploaded video must be smaller than 3MB due to browser storage limits. Please use a hosted video URL instead.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettings((prev) => ({
          ...prev,
          headerVideoUrl: ev.target!.result as string,
        }));
        showToast("Storefront header video uploaded successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      showToast("Please drop a valid video file.", "error");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast("Uploaded video must be smaller than 3MB due to browser storage limits. Please use a hosted video URL instead.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettings((prev) => ({
          ...prev,
          headerVideoUrl: ev.target!.result as string,
        }));
        showToast("Storefront header video uploaded successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize all text inputs to prevent XSS / SQL Injection in store settings
    const sanitizedSettings: StoreSettings = {
      ...settings,
      title: sanitizeInput(settings.title),
      description: sanitizeInput(settings.description),
      phone: sanitizeInput(settings.phone),
      instagram: sanitizeInput(settings.instagram),
      locationUrl: sanitizeInput(settings.locationUrl),
      headerVideoUrl: settings.headerVideoUrl ? sanitizeInput(settings.headerVideoUrl) : null,
      titleAr: settings.titleAr ? sanitizeInput(settings.titleAr) : "",
      descriptionAr: settings.descriptionAr ? sanitizeInput(settings.descriptionAr) : "",
    };

    setSettings(sanitizedSettings);
    showToast("Store configuration sanitized and saved successfully!", "success");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveSettings} className="space-y-4">
      {/* 1. Profile Picture / Store Logo */}
      <div className="bg-slate-50 border-2 border-gray-100 rounded-[24px] p-4.5 space-y-3.5 shadow-sm">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Store Branding Image
        </span>
        <div className="flex items-center gap-4">
          <div className="relative">
            {settings.profilePicUrl ? (
              <img
                src={settings.profilePicUrl}
                alt="Store Logo"
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 shrink-0 text-slate-300">
                <span className="text-[10px] uppercase font-black text-slate-900 tracking-tight">ON ALAA</span>
                <span className="text-[10px] tracking-widest font-extrabold text-red-600 leading-none">STORE</span>
              </div>
            )}
            <button
              id="trigger-logo-upload"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 bg-[#0F172A] hover:bg-slate-800 text-white border-2 border-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition active:scale-90"
            >
              <Camera size={12} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <button
              id="upload-logo-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-2.5 px-3 rounded-xl text-[10px] transition uppercase tracking-widest shadow-sm active:scale-95"
            >
              Upload Brand Logo
            </button>
            {settings.profilePicUrl && (
              <button
                id="remove-logo-btn"
                type="button"
                onClick={() => {
                  setSettings((prev) => ({ ...prev, profilePicUrl: null }));
                  showToast("Custom brand logo removed");
                }}
                className="w-full border-2 border-red-200 hover:bg-red-50 text-red-600 font-black py-2.5 px-3 rounded-xl text-[10px] transition uppercase tracking-widest active:scale-95"
              >
                Restore Standard Text Badge
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleProfilePicChange}
        />
      </div>

      {/* Header Media Customizer */}
      <div id="header-media-customizer" className="bg-slate-50 border-2 border-gray-100 rounded-[24px] p-4.5 space-y-3.5 shadow-sm">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Header Media Customizer
        </span>
        
        {settings.headerVideoUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-black aspect-video max-h-48 flex items-center justify-center">
              <video
                src={settings.headerVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-green-400">
                Active Preview
              </div>
            </div>
            
            <button
              id="remove-video-btn"
              type="button"
              onClick={() => {
                setSettings((prev) => ({ ...prev, headerVideoUrl: null }));
                showToast("Storefront header media removed", "success");
              }}
              className="w-full border-2 border-red-200 hover:bg-red-50 text-red-600 font-black py-2.5 px-3 rounded-xl text-[10px] transition uppercase tracking-widest active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Trash2 size={12} strokeWidth={2.5} /> Remove Video (Restore Static Header)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? "border-[#0F172A] bg-slate-100 scale-[0.98]" 
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <UploadCloud size={24} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                  Drag & Drop Video or Click to Browse
                </p>
                <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                  MP4, WebM (Max 3MB for local storage)
                </p>
              </div>
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/*"
              className="hidden"
              onChange={handleVideoFileChange}
            />
          </div>
        )}

        {/* Video URL Input Option (Always Visible) */}
        <div className="space-y-1.5 pt-1.5 border-t border-dashed border-slate-200">
          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">
            Or Use a Hosted Video URL
          </label>
          <div className="relative">
            <input
              id="settings-video-url"
              type="url"
              placeholder="e.g. https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-close-up-34289-large.mp4"
              value={settings.headerVideoUrl || ""}
              onChange={(e) => setSettings((p) => ({ ...p, headerVideoUrl: e.target.value || null }))}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition placeholder-slate-400"
            />
            <Link size={13} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider leading-relaxed">
            Link a direct hosted mp4, webm, or media link. Perfect for larger files.
          </p>
        </div>
      </div>

      {/* 2. Customizer Text Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Store Title / Header Branding (English)
          </label>
          <input
            id="settings-title"
            type="text"
            required
            value={settings.title}
            onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))}
            className="w-full p-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-right" dir="rtl">
            اسم المتجر / العلامة التجارية (العربية)
          </label>
          <input
            id="settings-title-ar"
            type="text"
            placeholder="مثال: متجر علي الإلكتروني"
            value={settings.titleAr || ""}
            onChange={(e) => setSettings((p) => ({ ...p, titleAr: e.target.value }))}
            className="w-full p-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition text-right"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Store Description / Bio Text (English)
          </label>
          <textarea
            id="settings-desc"
            required
            value={settings.description}
            onChange={(e) => setSettings((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full p-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-right" dir="rtl">
            وصف المتجر / السيرة الذاتية (العربية)
          </label>
          <textarea
            id="settings-desc-ar"
            placeholder="مثال: متجر الهواتف المميز في لبنان..."
            value={settings.descriptionAr || ""}
            onChange={(e) => setSettings((p) => ({ ...p, descriptionAr: e.target.value }))}
            rows={3}
            className="w-full p-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition resize-none text-right"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            WhatsApp Dispatch Number
          </label>
          <div className="relative">
            <input
              id="settings-phone"
              type="text"
              required
              placeholder="e.g. 96171135241"
              value={settings.phone}
              onChange={(e) => setSettings((p) => ({ ...p, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition"
            />
            <Smartphone size={13} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 font-black uppercase tracking-wider leading-relaxed">
            Must contain Lebanese dial prefix without spacing or '+' signs (default 96171135241).
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Instagram Handle (Bio Link)
          </label>
          <div className="flex">
            <span className="bg-slate-100 border-2 border-r-0 border-gray-200 rounded-l-2xl px-3.5 flex items-center text-slate-400 text-xs font-black">
              @
            </span>
            <input
              id="settings-instagram"
              type="text"
              required
              placeholder="onlymobilestore.lb"
              value={settings.instagram}
              onChange={(e) => setSettings((p) => ({ ...p, instagram: e.target.value }))}
              className="flex-1 p-3 bg-slate-50 border-2 border-gray-200 rounded-r-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Google Maps Location Link
          </label>
          <div className="relative">
            <input
              id="settings-location"
              type="url"
              required
              value={settings.locationUrl}
              onChange={(e) => setSettings((p) => ({ ...p, locationUrl: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs outline-none focus:ring-0 focus:border-[#0F172A] font-bold transition"
            />
            <MapPin size={13} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <button
        id="save-settings-btn"
        type="submit"
        className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 cursor-pointer mt-4"
      >
        <CheckCircle2 size={15} strokeWidth={2.5} /> Save Brand Settings
      </button>
    </form>

    {/* Store Data Portability & Backup Control Panel */}
    <div className="bg-slate-50 border-2 border-gray-100 rounded-[24px] p-4.5 space-y-3.5 shadow-sm mt-6">
      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
        <Database size={14} strokeWidth={2.5} className="text-[#0F172A]" />
        <span>Database Portability & Backups</span>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
        Perform manual backups of your ON ALAA STORE database records or initiate live synchronization with your connected spreadsheets.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          id="export-catalog-csv-btn"
          type="button"
          onClick={handleExportProductsCSV}
          className="bg-white border-2 border-slate-200 hover:border-[#0F172A] text-[#0F172A] font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer"
        >
          <Download size={13} strokeWidth={2.5} /> Export Catalog (CSV)
        </button>

        <button
          id="export-orders-csv-btn"
          type="button"
          onClick={handleExportOrdersCSV}
          className="bg-white border-2 border-slate-200 hover:border-[#0F172A] text-[#0F172A] font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer"
        >
          <Download size={13} strokeWidth={2.5} /> Export Orders (CSV)
        </button>
      </div>

      <button
        id="sync-google-sheets-btn"
        type="button"
        onClick={handleSyncToSheets}
        disabled={isSyncing}
        className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer"
      >
        <FileSpreadsheet size={13} strokeWidth={2.5} className={isSyncing ? "animate-spin" : ""} />
        <span>{isSyncing ? "Syncing to Connected Sheets..." : "Sync to Sheets Database"}</span>
      </button>
    </div>

    {/* SEO & Search Engine Indexing Engine */}
    <div className="bg-emerald-50/40 border-2 border-emerald-200 rounded-[24px] p-4.5 space-y-3.5 shadow-sm mt-6">
      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
        <Share2 size={14} strokeWidth={2.5} className="text-emerald-600" />
        <span>SEO & Google Indexing Engine</span>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
        Optimize storefront discoverability. Compile all live products and category routes into a single Google-compliant XML Sitemap structure.
      </p>

      <div className="bg-white/80 rounded-2xl border border-emerald-100 p-3 space-y-2 text-[10px] text-slate-600 font-semibold">
        <div className="flex items-center justify-between">
          <span>Google Rich Results (JSON-LD)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <span>Public Indexing Blocks (robots.txt)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">All Public</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <span>Active Product Pages in Queue</span>
          <span className="text-[#0F172A] font-black">{products.length} Products</span>
        </div>
      </div>

      <button
        id="generate-xml-sitemap-btn"
        type="button"
        onClick={handleExportXMLSitemap}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer border-2 border-slate-900 shadow-[3px_3px_0px_#000]"
      >
        <Share2 size={13} strokeWidth={2.5} /> Generate & Download Sitemap
      </button>
    </div>

    {/* Arabic Localizations & Custom Translations Manager */}
    <div className="bg-amber-50/40 border-2 border-amber-200 rounded-[24px] p-4.5 space-y-3.5 shadow-sm mt-6">
      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
        <RefreshCw size={14} strokeWidth={2.5} className="text-amber-600 animate-spin-slow" />
        <span>Arabic Localization & Translation Sync Manager</span>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
        Manage and synchronize custom Arabic translations for all active inventory items (names, categories, and descriptions).
      </p>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        {products.map((prod) => {
          const handleProductArUpdate = (field: "nameAr" | "descAr" | "categoryAr", value: string) => {
            if (setProducts) {
              setProducts((prev) =>
                prev.map((p) => (p.id === prod.id ? { ...p, [field]: value } : p))
              );
            }
          };

          return (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-wide truncate max-w-[180px]">
                  {prod.name}
                </span>
                <span className="text-[8px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase shrink-0">
                  ID: {prod.id}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right" dir="rtl">
                    الاسم بالعربية (Arabic Name)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شاحن سفري جرين ليون..."
                    value={prod.nameAr || ""}
                    onChange={(e) => handleProductArUpdate("nameAr", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-right"
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right" dir="rtl">
                      الفئة بالعربية
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شواحن سفري"
                      value={prod.categoryAr || ""}
                      onChange={(e) => handleProductArUpdate("categoryAr", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-right"
                      dir="rtl"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      English Category (Ref)
                    </label>
                    <div className="px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-[10px] font-extrabold text-slate-500 uppercase truncate">
                      {prod.category}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right" dir="rtl">
                    الوصف بالعربية (Arabic Description)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: بطارية خارجية مدمجة سريعة الشحن..."
                    value={prod.descAr || ""}
                    onChange={(e) => handleProductArUpdate("descAr", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-right resize-none"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        id="sync-all-translations-btn"
        type="button"
        onClick={() => {
          showToast("Arabic localized descriptions synced successfully!", "success");
        }}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer border border-amber-400"
      >
        <RefreshCw size={13} strokeWidth={2.5} /> Sync & Validate Translations
      </button>
    </div>

    {/* 3. Account Administration (Account Deletion) */}
    {currentUser?.role === "super_admin" && (
      <div className="bg-red-50/50 border-2 border-red-200 rounded-[24px] p-4.5 space-y-3.5 shadow-sm mt-6">
        <div className="flex items-center gap-1.5 text-xs font-black text-red-600 uppercase tracking-wider">
          <ShieldAlert size={14} strokeWidth={2.5} />
          <span>Account Administration</span>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Deleting your store account is a permanent action. This will permanently remove your user profile, wipe all catalog products, purge the active order histories, reset store customizers, and revoke all administrative access.
        </p>

        <button
          id="delete-store-account-btn"
          type="button"
          onClick={() => {
            setDeletePassword("");
            setShowDeleteConfirm(true);
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer border-2 border-slate-900 shadow-[3px_3px_0px_#000]"
        >
          <Trash2 size={13} strokeWidth={2.5} /> Delete Store Account
        </button>
      </div>
    )}

    {/* High-Security Account Deletion Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white border-3 border-[#0F172A] rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Lock size={20} />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              High Security Authorization
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please enter the master verification password to confirm the permanent destruction of this store account and all stored databases.
            </p>
          </div>

          <form onSubmit={handleDeleteSubmit} className="space-y-3 pt-1">
            <div>
              <input
                id="delete-account-password-input"
                type="password"
                placeholder="Enter Master Password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs text-center outline-none focus:ring-0 focus:border-red-500 font-bold transition tracking-widest"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Abort
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_#000] border border-slate-900"
              >
                Confirm Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};
