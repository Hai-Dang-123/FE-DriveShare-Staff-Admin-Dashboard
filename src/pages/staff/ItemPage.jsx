import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const PAGE_SIZE = 10;

// ICON WRAPPER
const IconCircle = ({ children, color = "bg-indigo-100 text-indigo-600" }) => (
  <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center`}>
    {children}
  </div>
);

// STATUS BADGE
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();

  let color = "bg-slate-100 text-slate-700 border border-slate-200";
  if (s === "PENDING") color = "bg-amber-50 text-amber-700 border border-amber-200";
  if (s === "ACTIVE" || s === "IN_USE")
    color = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "DELETED") color = "bg-rose-50 text-rose-700 border border-rose-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
};

export default function ItemPage() {
  const navigate = useNavigate();

  // LIST
  const [items, setItems] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [loadingList, setLoadingList] = useState(false);

  // DETAIL
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // SEARCH & SORT
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdat");
  const [sortOrder, setSortOrder] = useState("DESC");

  // ALERTS
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const showError = (msg) => {
    setError(msg);
    setMessage(null);
  };

  const formatCurrency = (value, currency = "VND") => {
    if (value == null) return "-";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: currency || "VND",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value} ${currency}`;
    }
  };

  // FETCH LIST
  const fetchItems = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("Item/get-all-items", {
        params: {
          pageNumber,
          pageSize: PAGE_SIZE,
          search,
          sortBy,
          sortOrder,
        },
      });

      const data = res?.data;
      if (data?.isSuccess && data.result) {
        const paginated = data.result;

        setItems(paginated.data || []);
        setPageInfo({
          currentPage: paginated.currentPage,
          totalPages: paginated.totalPages,
          totalCount: paginated.totalCount,
          hasPreviousPage: paginated.hasPreviousPage,
          hasNextPage: paginated.hasNextPage,
        });

        if (!selectedItemId && paginated.data?.length > 0) {
          setSelectedItemId(paginated.data[0].itemId);
        }
      } else {
        showError(data?.message || "Cannot load items.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading items.");
    } finally {
      setLoadingList(false);
    }
  };

  // FETCH DETAIL
  const fetchItemDetail = async (id) => {
    if (!id) return setSelectedItem(null);

    setLoadingDetail(true);
    try {
      const res = await api.get(`Item/get-item-by-id/${id}`);
      const data = res?.data;
      if (data?.isSuccess) {
        setSelectedItem(data.result);
      } else {
        showError(data?.message || "Cannot load item detail.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading detail.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // TRIGGER LIST LOAD
  useEffect(() => {
    const delay = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(delay); // debounce search
  }, [pageNumber, search, sortBy, sortOrder]);

  // TRIGGER DETAIL LOAD
  useEffect(() => {
    if (selectedItemId) fetchItemDetail(selectedItemId);
  }, [selectedItemId]);

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-slate-500">Staff Dashboard / Items</div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">Items</h1>
            <p className="text-slate-500 mt-1">Search, sort and view all items.</p>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* SEARCH & SORT BAR */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search item name, description, owner..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="createdat">Created At</option>
            <option value="itemname">Item Name</option>
            <option value="declaredvalue">Declared Value</option>
            <option value="status">Status</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT LIST */}
          <section className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold text-slate-900">All Items</h2>
              <p className="text-xs text-slate-500">
                {loadingList ? "Loading..." : `${pageInfo.totalCount} items`}
              </p>
            </div>

            <div className="flex-1 max-h-[520px] overflow-y-auto divide-y">
              {items.map((item) => {
                const active = item.itemId === selectedItemId;
                return (
                  <button
                    key={item.itemId}
                    onClick={() => setSelectedItemId(item.itemId)}
                    className={`w-full text-left px-5 py-3 transition ${
                      active
                        ? "bg-indigo-50 border-l-4 border-indigo-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className={`font-semibold ${active ? "text-indigo-700" : "text-slate-900"}`}>
                        {item.itemName}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="px-5 py-3 flex justify-between text-xs border-t">
              <button
                disabled={!pageInfo.hasPreviousPage}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border disabled:opacity-40"
              >
                Prev
              </button>
              <span>Page {pageInfo.currentPage} / {pageInfo.totalPages}</span>
              <button
                disabled={!pageInfo.hasNextPage}
                onClick={() => setPageNumber((p) => p + 1)}
                className="px-3 py-1 rounded border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>

          {/* RIGHT DETAIL */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
            {!selectedItem ? (
              <p className="text-slate-500">Select an item to view detail.</p>
            ) : (
              <>
                <h2 className="text-xl font-bold">{selectedItem.itemName}</h2>
                <StatusBadge status={selectedItem.status} />

                <p className="text-slate-600 mt-2 whitespace-pre-line">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Declared Value</div>
                    <div className="font-semibold">
                      {formatCurrency(
                        selectedItem.declaredValue,
                        selectedItem.currency
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Currency</div>
                    <div>{selectedItem.currency}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Owner ID</div>
                    <div className="break-all">{selectedItem.ownerId}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Provider ID</div>
                    <div className="break-all">{selectedItem.providerId}</div>
                  </div>
                </div>

                {/* IMAGES */}
                <div className="mt-6">
                  <div className="text-xs font-bold text-slate-700 mb-2">Images</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.imageUrls?.map((img) => (
                      <img
                        key={img.itemImageId}
                        src={img.imageUrl}
                        alt=""
                        className="rounded-lg border object-cover w-full h-24"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
