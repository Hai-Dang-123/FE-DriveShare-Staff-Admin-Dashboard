// src/pages/staff/PackagePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const PAGE_SIZE = 10;

// =======================
// COMPONENTS PHỤ TRỢ
// =======================
const IconCircle = ({ children, color = "bg-indigo-100 text-indigo-600" }) => (
  <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center`}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = status.toString().toUpperCase();

  let color = "bg-slate-100 text-slate-700 border border-slate-200";
  if (s === "PENDING")
    color = "bg-amber-50 text-amber-700 border border-amber-200";
  if (s === "APPROVED" || s === "IN_USE")
    color = "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "REJECTED" || s === "DELETED")
    color = "bg-rose-50 text-rose-700 border border-rose-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
};

// =======================
// MAIN COMPONENT
// =======================
export default function PackagePage() {
  const navigate = useNavigate();

  // LIST + PAGINATION
  const [packages, setPackages] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInfo, setPageInfo] = useState({});
  const [loadingList, setLoadingList] = useState(false);

  // DETAIL
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // SEARCH + SORT
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdat");
  const [sortOrder, setSortOrder] = useState("DESC");

  // debounce ref
  const searchTimeout = useRef(null);

  // ALERTS
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setError(null);
  };

  const showError = (msg) => {
    setError(msg);
    setMessage(null);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // =======================
  // API: LIST
  // =======================
  const fetchPackages = async (page) => {
    setLoadingList(true);
    try {
      const res = await api.get("Package/get-all-packages", {
        params: {
          pageNumber: page,
          pageSize: PAGE_SIZE,
          search: search || null,
          sortBy: sortBy || null,
          sortOrder: sortOrder || "ASC",
        },
      });

      const data = res?.data;
      if (data?.isSuccess && data.result) {
        const paginated = data.result;

        setPackages(paginated.data || []);
        setPageInfo(paginated);

        if (!selectedPackageId && paginated.data?.length > 0) {
          setSelectedPackageId(paginated.data[0].packageId);
        }
      } else {
        showError(data?.message || "Cannot load packages.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading packages.");
    } finally {
      setLoadingList(false);
    }
  };

  // =======================
  // API: DETAIL
  // =======================
  const fetchPackageDetail = async (id) => {
    if (!id) {
      setSelectedPackage(null);
      return;
    }

    setLoadingDetail(true);
    try {
      const res = await api.get(`Package/get-package-by-id/${id}`);
      const data = res?.data;

      if (data?.isSuccess && data.result) {
        setSelectedPackage(data.result);
      } else {
        showError(data?.message || "Cannot load detail.");
        setSelectedPackage(null);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading detail.");
      setSelectedPackage(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // =======================
  // EFFECTS
  // =======================
  useEffect(() => {
    fetchPackages(pageNumber);
  }, [pageNumber, sortBy, sortOrder]);

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setPageNumber(1);
      fetchPackages(1);
    }, 400);
  }, [search]);

  useEffect(() => {
    if (selectedPackageId) fetchPackageDetail(selectedPackageId);
  }, [selectedPackageId]);

  // =======================
  // RENDER UI
  // =======================
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-slate-500">
              Staff Dashboard / Packages
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">Packages</h1>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* SEARCH + SORT */}
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <input
            type="text"
            placeholder="Search package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 w-full md:w-1/3"
          />

          <select
            className="px-3 py-2 rounded-xl border border-slate-300"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdat">Created At</option>
            <option value="title">Title</option>
            <option value="weight">Weight (Kg)</option>
            <option value="volume">Volume (m3)</option>
          </select>

          <select
            className="px-3 py-2 rounded-xl border border-slate-300"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* LAYOUT: LIST + DETAIL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ======================= LIST ======================= */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">

            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">All Packages</h2>
              <p className="text-xs text-slate-500">
                {loadingList ? "Loading..." : `${pageInfo.totalCount || 0} total`}
              </p>
            </div>

            <div className="flex-1 max-h-[520px] overflow-y-auto divide-y divide-slate-100">
              {packages.map((pkg) => {
                const active = pkg.packageId === selectedPackageId;

                return (
                  <button
                    key={pkg.packageId}
                    onClick={() => setSelectedPackageId(pkg.packageId)}
                    className={`w-full text-left px-5 py-3.5 transition-colors ${
                      active
                        ? "bg-indigo-50/80 border-l-4 border-indigo-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-900"}`}>
                        {pkg.title || "(No title)"}
                      </span>
                      <StatusBadge status={pkg.status} />
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between mt-1">
                      <span className="font-mono">{pkg.packageCode}</span>
                      <span>Qty: {pkg.quantity} {pkg.unit}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page <b>{pageInfo.currentPage || 1}</b> / {pageInfo.totalPages || 1}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={!pageInfo.hasPreviousPage}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>

                <button
                  disabled={!pageInfo.hasNextPage}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="px-2 py-1 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* ======================= DETAIL ======================= */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Package Detail</h2>
              </div>

              {loadingDetail ? (
                <div className="px-6 py-8 text-sm text-slate-500">Loading...</div>
              ) : !selectedPackage ? (
                <div className="px-6 py-8 text-sm text-slate-500">
                  Select a package from the left to view detail.
                </div>
              ) : (
                <div className="px-6 py-5 space-y-6">

                  {/* Basic Info */}
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {selectedPackage.title}
                      </h3>
                      <StatusBadge status={selectedPackage.status} />
                      <div className="text-sm mt-1 text-slate-600">{selectedPackage.description}</div>
                    </div>
                  </div>

                  {/* Grid Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Weight (kg)</div>
                      <div className="font-semibold">{selectedPackage.weightKg}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Volume (m³)</div>
                      <div className="font-semibold">{selectedPackage.volumeM3}</div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Package Images</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(selectedPackage.packageImages || []).map((img) => (
                        <img
                          key={img.packageImageId}
                          src={img.imageUrl}
                          className="rounded-lg border object-cover h-28 w-full"
                        />
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
