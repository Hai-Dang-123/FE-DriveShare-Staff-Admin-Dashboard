// src/pages/staff/DocumentReviewList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

// Badge trạng thái verify
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
    case "INACTIVE":
      return (
        <span className={`${base} bg-gray-100 text-gray-700`}>
          Inactive
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

export default function DocumentReviewList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [sortField] = useState(""); // BE hiện tại chỉ có sortOrder
  const [sortOrder, setSortOrder] = useState("DESC");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  const fetchPendingReviews = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortOrder: sortOrder || "DESC",
      });

      if (search) params.append("search", search);
      if (sortField) params.append("sortField", sortField);

      const res = await api.get(`/UserDocument/pending-reviews?${params}`);

      if (res.data?.isSuccess) {
        const result = res.data.result || {};
        const data = result.data || [];
        setItems(data);
        setTotalPages(result.totalPages || 0);
        setTotalCount(result.totalCount || data.length || 0);
      } else {
        setError(res.data?.message || "Cannot load pending reviews");
      }
    } catch (err) {
      console.error(err);
      setError("Error while fetching pending reviews.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, search, sortOrder]);

  const handleOpenDetail = (userDocumentId) => {
    if (!userDocumentId) return;
    navigate(`/staff/document-reviews/${userDocumentId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Staff / Document Verification
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Pending User Documents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách các tài liệu người dùng đang chờ nhân viên duyệt.
            </p>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, document type..."
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white w-64"
              />
            </div>
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
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {totalCount}
              </span>{" "}
              documents
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents waiting for review
          </h2>

          {loading && <p className="text-gray-600 text-sm">Loading...</p>}
          {error && !loading && (
            <p className="text-sm text-red-600 mb-3">⚠ {error}</p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-gray-500">
              Hiện chưa có tài liệu nào đang chờ duyệt.
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Document Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((doc) => (
                    <tr
                      key={doc.userDocumentId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {doc.userName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doc.email || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {doc.documentType || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <VerifyStatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleOpenDetail(doc.userDocumentId)
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white"
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

          {/* PAGINATION SIMPLE */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {pageNumber} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() =>
                    setPageNumber((p) => Math.max(1, p - 1))
                  }
                  className="px-3 py-1 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={pageNumber >= totalPages}
                  onClick={() =>
                    setPageNumber((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-1 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
