import React, { useState } from "react";
import { 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  ClipboardList, 
  Filter, 
  User, 
  MapPin, 
  PhoneCall,
  X
} from "lucide-react";
import { Order } from "../types";
import { WAIcon } from "./WAIcon";

interface OrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const STATUS_OPTIONS: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLING: Record<Order["status"], string> = {
  Pending: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  Processing: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  Shipped: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  Delivered: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  Cancelled: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
};

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, setOrders }) => {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleUpdateStatus = (id: string, newStatus: Order["status"]) => {
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const customerName = o.customer || "";
    const orderId = o.id || "";
    const orderAddress = o.address || "";
    const query = searchQuery.trim().toLowerCase();
    
    const matchesSearch = 
      customerName.toLowerCase().includes(query) ||
      orderId.toLowerCase().includes(query) ||
      orderAddress.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Tab Header and Status Counter Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList size={14} className="text-yellow-500" />
          <span>Active Orders Database</span>
        </span>
        <span className="text-[10px] text-slate-500 font-extrabold bg-slate-50 border border-slate-200 rounded-full px-3 py-1 uppercase tracking-wider">
          Total Logged: {orders.length}
        </span>
      </div>

      {/* Control Panel: Filters and Search */}
      <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
        {/* Search */}
        <div className="relative">
          <input
            id="orders-search-input"
            type="text"
            placeholder="Search by customer name or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-[11px] font-black placeholder-slate-400 focus:outline-none focus:border-slate-800 transition uppercase tracking-wider"
          />
          <Search size={12} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchQuery && (
            <button
              id="clear-order-search-btn"
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              title="Clear Search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Status Filters horizontal list */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={11} strokeWidth={2.5} className="text-slate-400 shrink-0 mr-1" />
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
              statusFilter === "All"
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                statusFilter === st
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 border border-slate-100 rounded-2xl">
          <Truck size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-black text-slate-500 uppercase">No matching orders found</p>
          <p className="text-[9px] text-slate-400 mt-1 uppercase max-w-[200px] mx-auto font-bold tracking-wide">
            Try adjusting your search query or status filters.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {/* Scrollable Table viewport */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-3.5 w-12 text-center">Info</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-bold text-slate-700">
                {filteredOrders.map((o) => {
                  const isExpanded = !!expandedOrders[o.id];
                  return (
                    <React.Fragment key={o.id}>
                      {/* Normal Table Row */}
                      <tr 
                        className={`hover:bg-slate-50/70 transition duration-150 cursor-pointer ${
                          isExpanded ? "bg-slate-50/40" : ""
                        }`}
                        onClick={() => toggleExpand(o.id)}
                      >
                        {/* Expand toggle trigger */}
                        <td className="py-3.5 px-3.5 text-center">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Order ID column */}
                        <td className="py-3.5 px-3 font-mono text-[10px] text-slate-500 uppercase tracking-tighter">
                          #{o.id.replace("ord-", "")}
                        </td>

                        {/* Customer Name column */}
                        <td className="py-3.5 px-3 font-black text-slate-900 truncate max-w-[100px]">
                          {o.customer}
                        </td>

                        {/* Date column */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[10px]">
                          {o.date.split(",")[0]}
                        </td>

                        {/* Total column */}
                        <td className="py-3.5 px-3 font-black text-slate-950">
                          ${o.total.toFixed(2)}
                        </td>

                        {/* Status dropdown selector column */}
                        <td className="py-3.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value as Order["status"])}
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${
                              STATUS_STYLING[o.status]
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-800 font-bold uppercase">
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>

                      {/* Expandable row: Order details & actions */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-l-4 border-[#0F172A]">
                          <td colSpan={6} className="p-4 bg-slate-50/40 border-b border-slate-200">
                            <div className="space-y-3.5 max-w-md mx-auto">
                              {/* Order Metadata section */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} /> Order Placed: {o.date}
                                </span>
                                <span className="flex items-center gap-1 text-[#0F172A] font-black">
                                  <DollarSign size={11} /> {o.paymentMethod ? o.paymentMethod.toUpperCase() : "COD TRANSACTION"} ({o.paymentStatus ? o.paymentStatus.toUpperCase() : "UNPAID"})
                                </span>
                              </div>

                              {/* Customer Profile & Address Info */}
                              <div className="grid grid-cols-2 gap-3.5 text-slate-600">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                    <User size={9} /> Customer Name
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900 block leading-tight">
                                    {o.customer}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                    <MapPin size={9} /> Shipping Destination
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900 block leading-tight">
                                    {o.address}
                                  </span>
                                </div>
                              </div>

                              {/* Order Items List */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                  Ordered Itemized Breakdown
                                </span>
                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-inner">
                                  {o.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                                      <div className="truncate flex-1 pr-4">
                                        <span className="font-black text-slate-900">• {it.name}</span>
                                        {it.variantLabel && (
                                          <span className="text-[9px] text-slate-400 font-black uppercase ml-1.5">
                                            ({it.variantLabel})
                                          </span>
                                        )}
                                        <span className="text-slate-400 font-extrabold ml-1.5">×{it.qty}</span>
                                      </div>
                                      <span className="font-black text-slate-950 shrink-0">
                                        ${(it.qty * it.price).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  
                                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center text-xs font-black text-[#0F172A] mt-2">
                                    <span className="uppercase tracking-widest text-[9px] text-slate-400">GRAND TOTAL ({o.paymentMethod ? o.paymentMethod.toUpperCase() : "COD"})</span>
                                    <span>${o.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Contact Buttons */}
                              <div className="flex gap-2.5 pt-1.5">
                                <a
                                  href={`https://wa.me/${o.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                                >
                                  <WAIcon size={12} /> Contact Client
                                </a>
                                <a
                                  href={`tel:${o.phone}`}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                                >
                                  <PhoneCall size={11} strokeWidth={2.5} /> Direct Call
                                </a>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
