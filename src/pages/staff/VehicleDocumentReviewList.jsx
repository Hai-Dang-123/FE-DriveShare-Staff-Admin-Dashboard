import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

// Badge trạng thái verify cho xe
function VerifyStatusBadge({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "PENDING_REVIEW":
      return (
        <span className={`${base} bg-amber-50 text-amber-700`}>
          Pending review
        </span>
      );
    case "ACTIVE":
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700`}>
          Active
        </span>
      );
    case "REJECTED":
      return (
        <span className={`${base} bg-red-50 text-red-700`}>
          Rejected
        </span>
      );
    default:
      return (
        <span className={`${base} bg-slate-100 text-slate-700`}>
          {status || "N/A"}
        </span>
      );
  }
}

export default function VehicleDocumentReviewList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("DESC");

  const [pageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/VehicleDocument/pending-reviews", {
        params: {
          pageNumber,
          pageSize,
          sortOrder,
          sortField,
          search,
        },
      });

      if (res.data?.isSuccess) {
        setItems(res.data.result.data || []);
        setTotalCount(res.data.result.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed load vehicle documents:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search, sortOrder]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Staff / Vehicle Document Verification
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Pending Vehicle Documents
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Danh sách giấy tờ xe đang chờ nhân viên duyệt.
            </p>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 
            text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Plate, owner, type..."
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white w-64"
            />
          </div>

          <div className="flex items-center gap-4 justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="DESC">Newest first</option>
                <option value="ASC">Oldest first</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total:
              <span className="font-semibold text-gray-900"> {totalCount} </span>
              documents
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents Waiting for Review
          </h2>

          {loading && <p className="text-gray-600 text-sm">Loading...</p>}

          {!loading && items.length === 0 && (
            <p className="text-sm text-gray-500">No vehicle documents pending review.</p>
          )}

          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Plate</th>
                    <th className="px-4 py-3 text-left">Owner</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {items.map((doc) => (
                    <tr key={doc.vehicleDocumentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {doc.vehiclePlate}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {doc.ownerName}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {doc.documentType}
                      </td>

                      <td className="px-4 py-3">
                        <VerifyStatusBadge status={doc.status} />
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {new Date(doc.createdAt).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            navigate(`/staff/vehicle-document-reviews/${doc.vehicleDocumentId}`)
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-md 
                          bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
