import React, { useEffect, useState, useRef } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import api from "../../configs/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ICON WRAPPER
const IconBox = ({ children, color = "text-indigo-500" }) => (
  <div className={`w-9 h-9 ${color} flex items-center justify-center`}>
    {children}
  </div>
);

// SIDEBAR ITEM
const SidebarItem = ({ label, to, icon, active }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
        ${active ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-200"}
      `}
    >
      {icon}
      {label}
    </button>
  );
};

export default function AdminDashboard() {
  const location = useLocation();
const hasFetchedRef = useRef(false);

  // ========================
  // ADMIN MENU — GIỐNG STAFF
  // ========================
  const menu = [
    {
      label: "Dashboard",
      to: "/admin",
      icon: (
        <IconBox>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M3 12l2-2 7-7 7 7m-9-7v18"
            />
          </svg>
        </IconBox>
      ),
    },
    {
      label: "Users",
      to: "/admin/users",
      icon: (
        <IconBox>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"
            />
          </svg>
        </IconBox>
      ),
    },
    {
      label: "Transactions",
      to: "/admin/transactions",
      icon: (
        <IconBox color="text-green-600">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-3.866 0-7 1.79-7 4s3.134 4 7 4 7-1.79 7-4-3.134-4-7-4z"
            />
          </svg>
        </IconBox>
      ),
    },
  ];

  // ========================
  // DASHBOARD STATE
  // ========================
  const [rangeMonths, setRangeMonths] = useState(3);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalRevenue: 0,
    totalPackages: 0,
  });

  const [packagesByStatus, setPackagesByStatus] = useState([]); // [{name,value}]
  const [tripsByStatus, setTripsByStatus] = useState([]); // [{name,value}]
  const [revenueSeries, setRevenueSeries] = useState([]); // [{label,value}]
  const [tripsCreatedSeries, setTripsCreatedSeries] = useState([]); // [{label,value}]

  const PIE_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#A855F7", "#64748B"];

  // ========================
  // HELPERS
  // ========================
  const getDateRange = (months) => {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  };

  const toIsoForQuery = (d) => {
    // BE nhận DateTime from/to (Swagger đang parse OK với ISO)
    return d.toISOString();
  };

  const pickNumber = (obj, keys, fallback = 0) => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return Number(obj[k]) || 0;
    }
    return fallback;
  };

  const normalizeStatusSeries = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((x) => ({
      name: x.status ?? x.Status ?? x.role ?? x.Role ?? "UNKNOWN",
      value: Number(x.count ?? x.Count ?? x.value ?? x.Value) || 0,
    }));
  };

  const normalizeTimeSeries = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((x) => ({
      label: x.label ?? x.Label ?? "",
      value: Number(x.value ?? x.Value) || 0,
    }));
  };

  const formatCurrency = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const activePackagesCount = (() => {
    const active = packagesByStatus.find((x) => String(x.name).toUpperCase() === "ACTIVE");
    return active?.value || 0;
  })();

  // ========================
  // FETCH
  // ========================
  const fetchDashboard = async () => {
  if (loading) return; // 🔒 chặn spam request
  setError("");
  setLoading(true);


    try {
      const { from, to } = getDateRange(rangeMonths);

      const [
        overviewRes,
        tripsByStatusRes,
        packagesByStatusRes,
        revenueRes,
        tripsCreatedRes,
      ] = await Promise.all([
        api.get("/Admin/overview"),
        api.get("/Admin/trips/by-status"),
        api.get("/Admin/packages/by-status"),
        api.get("/Admin/revenue", {
          params: { from: toIsoForQuery(from), to: toIsoForQuery(to), groupBy: "month" },
        }),
        // optional (nếu BE chưa có data thì vẫn OK)
        api.get("/Admin/trips/created", {
          params: { from: toIsoForQuery(from), to: toIsoForQuery(to), groupBy: "month" },
        }),
      ]);

      // OVERVIEW
      if (overviewRes?.data?.isSuccess) {
        const r = overviewRes.data.result || {};
        setOverview({
          totalUsers: pickNumber(r, ["totalUsers", "TotalUsers"]),
          totalTrips: pickNumber(r, ["totalTrips", "TotalTrips"]),
          totalRevenue: pickNumber(r, ["totalRevenue", "TotalRevenue"]),
          totalPackages: pickNumber(r, ["totalPackages", "TotalPackages"]),
        });
      }

      // TRIPS BY STATUS
      if (tripsByStatusRes?.data?.isSuccess) {
        setTripsByStatus(normalizeStatusSeries(tripsByStatusRes.data.result));
      } else {
        setTripsByStatus([]);
      }

      // PACKAGES BY STATUS
      if (packagesByStatusRes?.data?.isSuccess) {
        setPackagesByStatus(normalizeStatusSeries(packagesByStatusRes.data.result));
      } else {
        setPackagesByStatus([]);
      }

      // REVENUE
      if (revenueRes?.data?.isSuccess) {
        setRevenueSeries(normalizeTimeSeries(revenueRes.data.result));
      } else {
        setRevenueSeries([]);
      }

      // TRIPS CREATED (OPTIONAL)
      if (tripsCreatedRes?.data?.isSuccess) {
        setTripsCreatedSeries(normalizeTimeSeries(tripsCreatedRes.data.result));
      } else {
        setTripsCreatedSeries([]);
      }
    } catch (e) {
      console.error(e);
      setError("Không tải được dữ liệu dashboard. Vui lòng thử lại.");
      setOverview({ totalUsers: 0, totalTrips: 0, totalRevenue: 0, totalPackages: 0 });
      setTripsByStatus([]);
      setPackagesByStatus([]);
      setRevenueSeries([]);
      setTripsCreatedSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (hasFetchedRef.current) {
    fetchDashboard();
    return;
  }

  hasFetchedRef.current = true;
  fetchDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [rangeMonths]);


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg p-5 space-y-2">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Menu</h2>

        {menu.map((item, idx) => (
          <SidebarItem
            key={idx}
            {...item}
            active={location.pathname === item.to}
          />
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome, admin user. Manage the system efficiently.
            </p>
          </div>

          {/* RANGE TOGGLE */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Range</span>
            <div className="bg-white rounded-full shadow-sm border p-1 flex">
              <button
                onClick={() => setRangeMonths(3)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  rangeMonths === 3 ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                3 months
              </button>
              <button
                onClick={() => setRangeMonths(6)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  rangeMonths === 6 ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                6 months
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* LOADING HINT */}
        {loading && (
          <div className="mb-6 text-sm text-gray-500">
            Loading dashboard data...
          </div>
        )}

        {/* ========================
            HÀNG 1 – KPI CARDS
        ========================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Users" value={overview.totalUsers} color="text-indigo-600" />
          <KpiCard title="Total Trips" value={overview.totalTrips} color="text-blue-600" />
          <KpiCard title="Total Revenue" value={formatCurrency(overview.totalRevenue)} color="text-green-600" />
          <KpiCard title="Active Packages" value={activePackagesCount} color="text-emerald-600" />
        </div>

        {/* ========================
            HÀNG 2 – BIỂU ĐỒ CHÍNH
        ========================= */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue over time */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Revenue over time</h2>
              <span className="text-xs text-gray-500">
                Last {rangeMonths} months
              </span>
            </div>

            {revenueSeries.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                No revenue data yet
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Revenue"]}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{ borderRadius: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trips by status */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trips by status</h2>
              <span className="text-xs text-gray-500">Distribution</span>
            </div>

            {tripsByStatus.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                No data
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tripsByStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {tripsByStatus.map((_, idx) => (
                        <Cell key={`cell-trip-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "Trips"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ========================
            HÀNG 3 – BIỂU ĐỒ PHỤ
        ========================= */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Packages by status */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Packages by status</h2>
              <span className="text-xs text-gray-500">Distribution</span>
            </div>

            {packagesByStatus.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                No data
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packagesByStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {packagesByStatus.map((_, idx) => (
                        <Cell key={`cell-pkg-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "Packages"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trips created (optional) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trips created (optional)</h2>
              <span className="text-xs text-gray-500">
                Last {rangeMonths} months
              </span>
            </div>

            {tripsCreatedSeries.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                No data
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tripsCreatedSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, "Trips"]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* REFRESH BUTTON (NHẸ) */}
        <div className="mt-8">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-lg bg-white border shadow-sm text-sm font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </main>
    </div>
  );
}

// ========================
// KPI CARD — GIỐNG STAFF
// ========================
function KpiCard({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <IconBox color={color}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
          </svg>
        </IconBox>
      </div>

      <div className="text-gray-500 text-sm uppercase">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
