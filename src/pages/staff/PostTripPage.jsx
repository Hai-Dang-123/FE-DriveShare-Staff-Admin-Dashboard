import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

// ====================== SORT OPTIONS ======================
const SORT_OPTIONS = [
  { label: "Default (Title A → Z)", field: "title", direction: "ASC", value: "title_asc" },
  { label: "Title Z → A", field: "title", direction: "DESC", value: "title_desc" },

  { label: "Created At (Newest first)", field: "createdat", direction: "DESC", value: "createdat_desc" },
  { label: "Created At (Oldest first)", field: "createdat", direction: "ASC", value: "createdat_asc" },

  { label: "Owner Name A → Z", field: "owner", direction: "ASC", value: "owner_asc" },
  { label: "Owner Name Z → A", field: "owner", direction: "DESC", value: "owner_desc" },
];

// ====================== BADGES ======================
function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "OPEN":
      return <span className={`${base} bg-green-50 text-green-700`}>OPEN</span>;
    case "CLOSED":
      return <span className={`${base} bg-gray-200 text-gray-700`}>CLOSED</span>;
    case "DELETED":
      return <span className={`${base} bg-red-50 text-red-700`}>DELETED</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-700`}>{status}</span>;
  }
}

export default function PostTripPage() {
  const navigate = useNavigate();

  // Data
  const [postTrips, setPostTrips] = useState([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Sort states
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [sortSelectValue, setSortSelectValue] = useState("title_asc");

  // Paging (tạm không dùng nhiều)
  const [pageNumber] = useState(1);
  const [pageSize] = useState(500);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [selectedTrip, setSelectedTrip] = useState(null);

  // ====================== DEBOUNCE SEARCH ======================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  // ====================== FETCH DATA ======================
  const fetchPostTrips = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      });

      if (search) params.append("search", search);
      if (sortField) params.append("sortField", sortField);
      if (sortDirection) params.append("sortDirection", sortDirection);

      const res = await api.get(`/PostTrip/all?${params.toString()}`);

      if (res.data?.isSuccess) {
        const result = res.data.result || {};
        const data = result.data || [];

        setPostTrips(data);
        setTotalCount(result.totalCount || data.length || 0);
      } else {
        setError(res.data?.message || "Cannot load PostTrips");
      }
    } catch (err) {
      setError("Error fetching PostTrips.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPostTrips();
  }, [search, sortField, sortDirection]);

  // ====================== SORT DROPDOWN ======================
  const handleSortSelect = (value) => {
    setSortSelectValue(value);
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) {
      setSortField(opt.field);
      setSortDirection(opt.direction);
    }
  };

  // ====================== TABLE SORT HEADER ======================
  const handleHeaderSort = (field) => {
    const normalized = field.toLowerCase();

    if (sortField === normalized) {
      const newDir = sortDirection === "ASC" ? "DESC" : "ASC";
      setSortDirection(newDir);
      setSortSelectValue(`${normalized}_${newDir.toLowerCase()}`);
    } else {
      setSortField(normalized);
      setSortDirection("ASC");
      setSortSelectValue(`${normalized}_asc`);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field.toLowerCase()) return null;
    return <span className="text-xs">{sortDirection === "ASC" ? "▲" : "▼"}</span>;
  };

  const formatDate = (v) => {
    if (!v) return "N/A";
    const d = new Date(v);
    return d.toLocaleString();
  };

  // ====================== UI RENDER ======================
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Admin / PostTrip Management</p>
            <h1 className="text-3xl font-bold text-gray-900">PostTrip Management</h1>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Title, description, owner..."
              className="border border-gray-300 rounded-md px-3 py-1.5 w-60 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by</label>
            <select
              value={sortSelectValue}
              onChange={(e) => handleSortSelect(e.target.value)}
              className="border border-gray-300 px-3 py-1.5 rounded-md text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{totalCount}</span> trips
            </p>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All PostTrips</h2>

          {loading && <p className="text-sm text-gray-600">Loading...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && postTrips.length === 0 && (
            <p className="text-sm text-gray-500">No PostTrips found.</p>
          )}

          {!loading && postTrips.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("title")}
                    >
                      Title {renderSortIcon("title")}
                    </th>

                    <th className="px-4 py-3 text-left">Owner</th>

                    <th className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("createdat")}
                    >
                      Created At {renderSortIcon("createdat")}
                    </th>

                    <th className="px-4 py-3 text-left">Status</th>

                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {postTrips.map((p) => (
                    <tr key={p.postTripId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>

                      <td className="px-4 py-3">{p.owner?.fullName || "N/A"}</td>

                      <td className="px-4 py-3">{formatDate(p.createAt)}</td>

                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedTrip(p)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
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

        {/* MODAL DETAIL */}
        {selectedTrip && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative">

              <button
                onClick={() => setSelectedTrip(null)}
                className="absolute top-3 right-3 text-gray-600 text-xl"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold mb-4">{selectedTrip.title}</h2>

              <div className="space-y-2 text-sm">
                <p><strong>Description:</strong> {selectedTrip.description || "N/A"}</p>
                <p><strong>Owner:</strong> {selectedTrip.owner?.fullName || "N/A"}</p>
                <p><strong>Created At:</strong> {formatDate(selectedTrip.createAt)}</p>
                <p><strong>Status:</strong> <StatusBadge status={selectedTrip.status} /></p>

                <p className="mt-3 font-semibold">Trip Summary:</p>
                <p>From: {selectedTrip.trip?.startLocationName}</p>
                <p>To: {selectedTrip.trip?.endLocationName}</p>
                <p>Vehicle: {selectedTrip.trip?.vehicleModel} ({selectedTrip.trip?.vehiclePlate})</p>

                <p className="mt-3 font-semibold">Details:</p>
                {selectedTrip.postTripDetails?.map((d) => (
                  <div key={d.postTripDetailId} className="border p-2 rounded-md mb-2 bg-gray-50">
                    <p>Type: {d.type}</p>
                    <p>Required Count: {d.requiredCount}</p>
                    <p>Price: {d.pricePerPerson}</p>
                    <p>Pickup: {d.pickupLocation}</p>
                    <p>Dropoff: {d.dropoffLocation}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-4 py-2 rounded-md border border-gray-300"
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
