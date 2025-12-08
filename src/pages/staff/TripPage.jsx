// src/pages/admin/TripPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const SORT_OPTIONS = [
  {
    label: "Created At (Newest first)",
    field: "createdAt",
    direction: "DESC",
    value: "createdAt_desc",
  },
  {
    label: "Created At (Oldest first)",
    field: "createdAt",
    direction: "ASC",
    value: "createdAt_asc",
  },
  {
    label: "Trip Code A → Z",
    field: "tripCode",
    direction: "ASC",
    value: "tripCode_asc",
  },
  {
    label: "Trip Code Z → A",
    field: "tripCode",
    direction: "DESC",
    value: "tripCode_desc",
  },
  {
    label: "Owner Name A → Z",
    field: "ownerName",
    direction: "ASC",
    value: "ownerName_asc",
  },
  {
    label: "Owner Name Z → A",
    field: "ownerName",
    direction: "DESC",
    value: "ownerName_desc",
  },
];

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        N/A
      </span>
    );
  }

  const s = status.toUpperCase();

  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  if (s === "COMPLETED") {
    return (
      <span className={`${base} bg-green-50 text-green-700`}>COMPLETED</span>
    );
  }
  if (s === "CANCELLED") {
    return (
      <span className={`${base} bg-red-50 text-red-700`}>CANCELLED</span>
    );
  }
  if (s === "IN_TRANSIT" || s === "LOADING" || s === "UNLOADING") {
    return (
      <span className={`${base} bg-blue-50 text-blue-700`}>{s}</span>
    );
  }
  if (s === "CREATED" || s.startsWith("AWAITING") || s.startsWith("PENDING")) {
    return (
      <span className={`${base} bg-yellow-50 text-yellow-700`}>{s}</span>
    );
  }

  return (
    <span className={`${base} bg-slate-100 text-slate-700`}>{s}</span>
  );
}

export default function TripPage() {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);

  // search FE
  const [searchInput, setSearchInput] = useState("");

  // sort FE
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [sortSelectValue, setSortSelectValue] = useState("createdAt_desc");

  // paging: 1 trang to cho Admin xem
  const [pageNumber] = useState(1);
  const [pageSize] = useState(200);

  const [totalCount, setTotalCount] = useState(0);

  const fetchTrips = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(
        `/Trip/all?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );

      if (res.data?.isSuccess) {
        const result = res.data.result || {};
        const data = result.data || [];
        setTrips(data);
        setTotalCount(result.totalCount || data.length || 0);
      } else {
        setError(res.data?.message || "Cannot load trips");
      }
    } catch (err) {
      setError("Error while fetching trips.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const formatDrivers = (driverNames) => {
    if (!driverNames || !driverNames.length) return "N/A";
    return driverNames.join(", ");
  };

  const formatPackages = (packageCodes) => {
    if (!packageCodes || !packageCodes.length) return "N/A";
    if (packageCodes.length <= 3) return packageCodes.join(", ");
    return `${packageCodes.slice(0, 3).join(", ")} (+${packageCodes.length - 3})`;
  };

  // SEARCH + SORT FE
  const normalizedTrips = trips.map((t) => ({
    ...t,
    // chuẩn hóa key để dùng chung
    tripCode: t.tripCode || t.TripCode || "",
    ownerName: t.ownerName || t.OwnerName || "",
    ownerCompany: t.ownerCompany || t.OwnerCompany || "",
    status: t.status || t.Status || "",
    vehiclePlate: t.vehiclePlate || t.VehiclePlate || "",
    vehicleModel: t.vehicleModel || t.VehicleModel || "",
    startAddress: t.startAddress || t.StartAddress || "",
    endAddress: t.endAddress || t.EndAddress || "",
    createAt: t.createAt || t.CreateAt || t.createdAt,
    driverNames: t.driverNames || t.DriverNames || [],
    packageCodes: t.packageCodes || t.PackageCodes || [],
    tripRouteSummary: t.tripRouteSummary || t.TripRouteSummary || "",
  }));

  // filter theo search
  const searchLower = searchInput.trim().toLowerCase();

  const searchedTrips = normalizedTrips.filter((t) => {
    if (!searchLower) return true;

    const haystack = [
      t.tripCode,
      t.ownerName,
      t.ownerCompany,
      t.vehiclePlate,
      t.vehicleModel,
      t.startAddress,
      t.endAddress,
      t.status,
      ...(t.driverNames || []),
      ...(t.packageCodes || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchLower);
  });

  // sort FE
  const sortedTrips = [...searchedTrips].sort((a, b) => {
    const field = sortField;
    const dir = sortDirection === "ASC" ? 1 : -1;

    const va = a[field];
    const vb = b[field];

    // date sort
    if (field === "createdAt" || field === "createAt") {
      const da = new Date(a.createAt || a.createdAt);
      const db = new Date(b.createAt || b.createdAt);
      if (da < db) return -1 * dir;
      if (da > db) return 1 * dir;
      return 0;
    }

    const sa = (va ?? "").toString().toLowerCase();
    const sb = (vb ?? "").toString().toLowerCase();

    if (sa < sb) return -1 * dir;
    if (sa > sb) return 1 * dir;
    return 0;
  });

  const handleSortSelectChange = (value) => {
    setSortSelectValue(value);
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (!opt) return;

    setSortField(opt.field);
    setSortDirection(opt.direction);
  };

  const handleHeaderSort = (field) => {
    const normalized = field;
    if (sortField === normalized) {
      const nextDir = sortDirection === "ASC" ? "DESC" : "ASC";
      setSortDirection(nextDir);
      setSortSelectValue(`${normalized}_${nextDir.toLowerCase()}`);
    } else {
      setSortField(normalized);
      setSortDirection("ASC");
      setSortSelectValue(`${normalized}_asc`);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return (
      <span className="text-xs text-gray-500">
        {sortDirection === "ASC" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Admin / Trips</p>
            <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          </div>

         <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FILTER + SEARCH + SORT */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Search */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Trip code, owner, vehicle, route..."
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-72"
            />
          </div>

          {/* Right: Sort + Total */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort by
              </label>
              <select
                value={sortSelectValue}
                onChange={(e) => handleSortSelectChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {totalCount || sortedTrips.length}
              </span>{" "}
              trips
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Trips
          </h2>

          {loading && <p className="text-gray-600 text-sm">Loading...</p>}
          {error && !loading && (
            <p className="text-sm text-red-600 mb-3">⚠ {error}</p>
          )}

          {!loading && !error && sortedTrips.length === 0 && (
            <p className="text-sm text-gray-500">No trips found.</p>
          )}

          {!loading && !error && sortedTrips.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleHeaderSort("tripCode")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Trip Code {renderSortIcon("tripCode")}
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleHeaderSort("ownerName")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Owner {renderSortIcon("ownerName")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Route</th>
                    <th className="px-4 py-3 text-left">Drivers</th>
                    <th className="px-4 py-3 text-left">Packages</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleHeaderSort("createdAt")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Created At {renderSortIcon("createdAt")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedTrips.map((t) => (
                    <tr
                      key={t.tripId || t.TripId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {t.tripCode || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex flex-col">
                          <span>{t.ownerName || "N/A"}</span>
                          {t.ownerCompany && (
                            <span className="text-xs text-gray-500">
                              {t.ownerCompany}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex flex-col">
                          <span>{t.vehiclePlate || "N/A"}</span>
                          {t.vehicleModel && (
                            <span className="text-xs text-gray-500">
                              {t.vehicleModel} {t.vehicleType ? `• ${t.vehicleType}` : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex flex-col">
                          <span className="truncate max-w-xs">
                            {t.startAddress || "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ↓
                          </span>
                          <span className="truncate max-w-xs">
                            {t.endAddress || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="truncate max-w-xs inline-block">
                          {formatDrivers(t.driverNames)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatPackages(t.packageCodes)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDateTime(t.createAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedTrip(t)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL VIEW DETAIL */}
        {selectedTrip && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative">
              <button
                onClick={() => setSelectedTrip(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Trip: {selectedTrip.tripCode || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Owner: {selectedTrip.ownerName || "N/A"}{" "}
                    {selectedTrip.ownerCompany
                      ? `(${selectedTrip.ownerCompany})`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={selectedTrip.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Trip Info
                  </h4>
                  <div>
                    <span className="font-medium text-gray-600">
                      Trip Code:{" "}
                    </span>
                    {selectedTrip.tripCode || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Created At:{" "}
                    </span>
                    {formatDateTime(selectedTrip.createAt)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Updated At:{" "}
                    </span>
                    {formatDateTime(selectedTrip.updateAt || selectedTrip.UpdatedAt)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Route Summary:{" "}
                    </span>
                    {selectedTrip.tripRouteSummary || "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Vehicle
                  </h4>
                  <div>
                    <span className="font-medium text-gray-600">
                      Plate:{" "}
                    </span>
                    {selectedTrip.vehiclePlate || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Model:{" "}
                    </span>
                    {selectedTrip.vehicleModel || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Type:{" "}
                    </span>
                    {selectedTrip.vehicleType || "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Route
                  </h4>
                  <div>
                    <span className="font-medium text-gray-600">
                      From:{" "}
                    </span>
                    {selectedTrip.startAddress || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">To: </span>
                    {selectedTrip.endAddress || "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Drivers & Packages
                  </h4>
                  <div>
                    <span className="font-medium text-gray-600">
                      Drivers:{" "}
                    </span>
                    {formatDrivers(selectedTrip.driverNames)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Packages:{" "}
                    </span>
                    {formatPackages(selectedTrip.packageCodes)}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
