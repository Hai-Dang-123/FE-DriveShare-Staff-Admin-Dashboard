// ========================================================================
// STAFF – VEHICLE PAGE (AIRBNB STYLE, 2 CỘT: LIST + DETAIL)
// Không dùng modal. Panel bên phải hiển thị Vehicle + Documents (chỉ khi click).
// FLOW giống UserPage: vào trang chỉ fetch list, click mới fetch detail + docs.
// ========================================================================

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const PAGE_SIZE = 10;

/* ===========================================================
   BADGE – VEHICLE STATUS
=========================================================== */
const DOC_STATUS_MAP = {
  0: "ACTIVE",
  1: "INACTIVE",
  2: "DELETED",
  3: "PENDING_REVIEW",
  4: "REJECTED",
};


const normalizeDocStatus = (status) => {
  if (typeof status === "number") {
    return DOC_STATUS_MAP[status] || "UNKNOWN";
  }
  return status;
};


/* ===========================================================
   BADGE – DOCUMENT STATUS
=========================================================== */
function VehicleStatusBadge({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold";

  switch (status) {
    case "ACTIVE":
    case "IN_USE":
      return (
        <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>
          {status}
        </span>
      );
    case "INACTIVE":
      return (
        <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}>
          {status}
        </span>
      );
    case "DELETED":
      return (
        <span className={`${base} bg-gray-100 text-gray-500 border border-gray-200`}>
          {status}
        </span>
      );
    default:
      return (
        <span className={`${base} bg-slate-50 text-slate-600 border border-slate-200`}>
          {status || "N/A"}
        </span>
      );
  }
}

/* ===========================================================
   BADGE – DOCUMENT STATUS (SAU NORMALIZE)
=========================================================== */
function DocumentStatusBadge({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold";

  switch (status) {
    case "PENDING_REVIEW":
      return (
        <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}>
          Pending
        </span>
      );
    case "ACTIVE":
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
          Active
        </span>
      );
    case "REJECTED":
      return (
        <span className={`${base} bg-red-50 text-red-700 border border-red-200`}>
          Rejected
        </span>
      );
    case "INACTIVE":
      return (
        <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200`}>
          Inactive
        </span>
      );
    default:
      return (
        <span className={`${base} bg-gray-50 text-gray-600 border border-gray-200`}>
          No docs
        </span>
      );
  }
}

/* ===========================================================
   MAIN PAGE
=========================================================== */
export default function VehiclePage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
    totalCount: 0,
  });

  const [pageNumber, setPageNumber] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("ASC");

  const [previewImage, setPreviewImage] = useState(null);

  const pendingRef = useRef(null);
  const requestSeqRef = useRef(0);
  /* ===========================================================
     HELPERS: DOC STATUS
  ============================================================ */
  const computeDocumentStatus = (docs) => {
    const list = docs || [];
    const hasPending = list.some((d) => normalizeDocStatus(d.status) === "PENDING_REVIEW");
    const hasRejected = list.some((d) => normalizeDocStatus(d.status) === "REJECTED");
    const hasActive = list.some((d) => normalizeDocStatus(d.status) === "ACTIVE");

    return (
      (hasPending && "PENDING_REVIEW") ||
      (hasRejected && "REJECTED") ||
      (hasActive && "ACTIVE") ||
      "NONE"
    );
  };
  /* ===========================================================
     FETCH VEHICLES (LIST ONLY) ✅ FIX FLOW
     - chỉ gọi /Vehicle
     - không dùng documents từ list nữa
     - không auto select
  ============================================================ */
 const fetchVehicles = async () => {
    setLoadingList(true);
    try {
      const params = {
        pageNumber,
        pageSize: PAGE_SIZE,
      };
      if (search) params.search = search.trim();
      if (sortBy) {
        params.sortBy = sortBy.toLowerCase();
        params.sortOrder = sortOrder;
      }

      const res = await api.get("/Vehicle", { params });
      if (res.data?.isSuccess) {
        const pg = res.data.result;
       setVehicles(
  (pg.data || []).map((v) => ({
    ...v,
    documentStatus: normalizeDocStatus(v.documentStatus),
    hasPendingDocumentRequest: v.hasPendingDocumentRequest === true,
  }))
);

        setPagination(pg);
      }
    } catch (err) {
      console.error(err);
      setVehicles([]);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, [pageNumber, search, sortBy, sortOrder]);

  /* ===========================================================
     FETCH VEHICLE DETAIL (CHỈ GỌI KHI CLICK) ✅ FIX FLOW
  ============================================================ */
  const fetchVehicleDetail = async (vehicleId) => {
    if (!vehicleId) return;
    setLoadingDetail(true);
    const seq = ++requestSeqRef.current;

    try {
      const res = await api.get(`/Vehicle/${vehicleId}`);
      if (seq !== requestSeqRef.current) return;

      if (res.data?.isSuccess) {
        setSelectedVehicle((prev) => ({
          ...res.data.result,
          documents: prev?.documents || [],
          documentStatus: prev?.documentStatus || "NONE",
        }));
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingDetail(false);
  };
  /* ===========================================================
     FETCH VEHICLE DOCUMENTS (CHỈ GỌI KHI CLICK) ✅ FIX FLOW
     Endpoint giả định: /VehicleDocument/vehicle/{vehicleId}
     (nếu BE bạn khác path, bạn nói đúng path tôi chỉnh đúng 1 dòng)
  ============================================================ */
  const fetchVehicleDocuments = async (vehicleId, scroll = true) => {
    if (!vehicleId) return;
    setLoadingDocs(true);
    const seq = ++requestSeqRef.current;

    try {
      const res = await api.get(`/VehicleDocument/vehicle/${vehicleId}`);
      if (seq !== requestSeqRef.current) return;

      if (!res.data?.isSuccess) {
        setSelectedVehicle((prev) => ({
          ...prev,
          documents: [],
          documentStatus: "NONE",
        }));
        return;
      }

      const docsRaw = res.data.result?.documents || res.data.result || [];
      const docs = docsRaw.map((d) => ({
        ...d,
        status: normalizeDocStatus(d.status),
      }));

      docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const docStatus = computeDocumentStatus(docs);
      const hasPending = docStatus === "PENDING_REVIEW";

      setSelectedVehicle((prev) => ({
        ...prev,
        documents: docs,
        documentStatus: docStatus,
      }));

      setVehicles((prev) =>
        prev.map((v) =>
          v.vehicleId === vehicleId
            ? {
                ...v,
                documentStatus: docStatus,
                hasPendingDocumentRequest: hasPending,
              }
            : v
        )
      );

      if (scroll) {
        const firstPending = docs.find((d) => d.status === "PENDING_REVIEW");
        if (firstPending) {
          setTimeout(
            () => pendingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
            100
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingDocs(false);
  };

  /* ===========================================================
     CLICK ROW (FLOW giống UserPage)
     - set selected
     - gọi detail + docs
  ============================================================ */
  const handleSelectVehicle = (v) => {
    setSelectedVehicleId(v.vehicleId);
    setSelectedVehicle({
      ...v,
      documents: [],
      documentStatus: v.documentStatus || "NONE",
    });
    fetchVehicleDetail(v.vehicleId);
    fetchVehicleDocuments(v.vehicleId, true);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d) ? "-" : d.toLocaleDateString();
  };

  const firstPendingId =
    selectedVehicle?.documents?.find((d) => d.status === "PENDING_REVIEW")
      ?.vehicleDocumentId || null;

  /* ===========================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ⭐ UPDATED: container rộng hơn để panel to hơn */}
      <div className="max-w-[1600px] mx-auto px-10 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Staff / Vehicles
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Vehicles</h1>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* GRID 2 CỘT */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT – LIST */}
          {/* ⭐ UPDATED: 5 -> 6 để khung list rộng hơn */}
          <div className="col-span-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col h-[680px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Vehicles
                  </h2>
                  <p className="text-xs text-gray-500">
                    Quick overview & document status
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">
                    {pagination.totalCount}
                  </span>{" "}
                  total
                </span>
              </div>

              {/* SEARCH */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search plate / model / brand..."
                  value={search}
                  onChange={(e) => {
                    setPageNumber(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full text-sm rounded-full border border-gray-200 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>

              {/* SORT */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Sort by</span>
                  <select
                    className="border border-gray-200 rounded-full text-xs px-2 py-1 bg-white"
                    value={sortBy}
                    onChange={(e) => {
                      setPageNumber(1);
                      setSortBy(e.target.value);
                    }}
                  >
                    <option value="">Default</option>
                    <option value="brand">Brand</option>
                    <option value="model">Model</option>
                    <option value="year">Year</option>
                    <option value="payload">Payload</option>
                    <option value="volume">Volume</option>
                    <option value="createdat">Created At</option>
                  </select>

                  <select
                    className="border border-gray-200 rounded-full text-xs px-2 py-1 bg-white"
                    value={sortOrder}
                    onChange={(e) => {
                      setPageNumber(1);
                      setSortOrder(e.target.value);
                    }}
                  >
                    <option value="ASC">ASC</option>
                    <option value="DESC">DESC</option>
                  </select>
                </div>
              </div>

              {/* TABLE */}
              <div className="flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white">
                {loadingList ? (
                  <div className="p-4 text-sm text-gray-500">Loading...</div>
                ) : vehicles.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No vehicles found.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    {/* ⭐ UPDATED: dùng w-full để tránh scrollbar ngang */}
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="text-xs text-gray-500">
                          <th className="px-4 py-2 text-left font-medium">
                            Plate
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Model
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Owner
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Docs
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {vehicles.map((v) => {
                          const isSelected =
                            selectedVehicleId === v.vehicleId;
                          return (
                            <tr
  key={v.vehicleId}
  onClick={() => handleSelectVehicle(v)}
  className={`cursor-pointer
    ${v.hasPendingDocumentRequest ? "bg-amber-50 border-l-4 border-amber-400" : ""}
    ${isSelected ? "bg-indigo-50/70" : "hover:bg-gray-50"}
  `}
>

                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {v.plateNumber}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {v.model}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {v.brand}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {v.owner?.fullName || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <VehicleStatusBadge status={v.status} />
                              </td>
                              <td className="px-4 py-3">
                                <DocumentStatusBadge
                                  status={v.documentStatus}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <div>
                  Page{" "}
                  <span className="font-medium">
                    {pagination.currentPage || 1}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium">
                    {pagination.totalPages || 1}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={
                      !pagination.totalPages ||
                      pageNumber >= pagination.totalPages
                    }
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT – DETAIL + DOCUMENTS */}
          {/* ⭐ UPDATED: 7 -> 6 cho cân 2 panel */}
          <div className="col-span-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 h-[560px] flex flex-col">
              {!selectedVehicle ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Select a vehicle on the left to view details.
                </div>
              ) : (
                <>
                  {/* HEADER DETAIL */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                        Vehicle
                      </div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedVehicle.plateNumber}
                        </h2>
                        <VehicleStatusBadge status={selectedVehicle.status} />
                        <DocumentStatusBadge
                          status={selectedVehicle.documentStatus}
                        />
                        {(loadingDetail || loadingDocs) && (
                          <span className="text-[11px] text-gray-400">
                            Loading...
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedVehicle.brand} • {selectedVehicle.model} •{" "}
                        {selectedVehicle.yearOfManufacture}
                      </p>
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      <div>
                        Created:{" "}
                        <span className="font-medium">
                          {formatDate(selectedVehicle.createdAt)}
                        </span>
                      </div>
                      {selectedVehicle.owner && (
                        <div className="mt-1">
                          Owner:{" "}
                          <span className="font-medium">
                            {selectedVehicle.owner.fullName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BODY SCROLLABLE */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                    {/* BASIC INFO */}
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Basic information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <InfoRow label="Brand" value={selectedVehicle.brand} />
                        <InfoRow label="Model" value={selectedVehicle.model} />
                        <InfoRow
                          label="Year"
                          value={selectedVehicle.yearOfManufacture}
                        />
                        <InfoRow label="Color" value={selectedVehicle.color} />
                        <InfoRow
                          label="Payload (kg)"
                          value={selectedVehicle.payloadInKg}
                        />
                        <InfoRow
                          label="Volume (m³)"
                          value={selectedVehicle.volumeInM3}
                        />
                      </div>
                    </section>

                    {/* OWNER */}
                    {selectedVehicle.owner && (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Owner
                        </h3>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">
                            {selectedVehicle.owner.fullName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedVehicle.owner.companyName}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* DOCUMENTS */}
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Vehicle documents
                      </h3>

                      {(!selectedVehicle.documents ||
                        selectedVehicle.documents.length === 0) && (
                        <div className="text-xs text-gray-500">
                          No documents uploaded for this vehicle.
                        </div>
                      )}

                      <div className="space-y-4">
                        {selectedVehicle.documents?.map((doc) => {
                          const isPending = doc.status === "PENDING_REVIEW";
                          const isTarget =
                            doc.vehicleDocumentId === firstPendingId;

                          return (
                            <div
                              key={doc.vehicleDocumentId}
                              ref={isTarget ? pendingRef : null}
                              className={`rounded-xl border shadow-sm p-4 transition ${
                                isPending
                                  ? "border-amber-300 bg-amber-50/60"
                                  : "border-gray-100 bg-gray-50"
                              }`}

                              
                            >
                             

                              {/* HEADER */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="text-xs uppercase tracking-wide text-gray-400">
                                    Document
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {doc.documentType}
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Expire: {formatDate(doc.expirationDate)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <DocumentStatusBadge status={doc.status} />
                                  {doc.adminNotes && (
                                    <div className="text-[11px] text-gray-500 mt-1 max-w-[180px]">
                                      {doc.adminNotes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* THUMBNAILS */}
                              <div className="grid grid-cols-2 gap-3">
                                <div
                                  className="cursor-pointer group"
                                  onClick={() =>
                                    setPreviewImage(doc.frontDocumentUrl)
                                  }
                                >
                                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <img
                                      src={doc.frontDocumentUrl}
                                      alt="Front"
                                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="text-[11px] text-gray-600 mt-1">
                                    Front
                                  </div>
                                </div>

                                {doc.backDocumentUrl && (
                                  <div
                                    className="cursor-pointer group"
                                    onClick={() =>
                                      setPreviewImage(doc.backDocumentUrl)
                                    }
                                  >
                                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                      <img
                                        src={doc.backDocumentUrl}
                                        alt="Back"
                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                    <div className="text-[11px] text-gray-600 mt-1">
                                      Back
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* REVIEW BUTTON */}
                              {doc.status === "PENDING_REVIEW" && (
  <button
    onClick={() =>
      navigate(`/staff/vehicle-document-reviews/${doc.vehicleDocumentId}`)
    }
    className="mt-3 w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm font-medium"
  >
    Review pending document
  </button>)}
{(doc.status === "REJECTED" || doc.status === "INACTIVE") && (
  <button
    onClick={() =>
      navigate(`/staff/vehicle-document-reviews/${doc.vehicleDocumentId}`)
    }
    className="mt-2 w-full rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 text-sm"
  >
    View review history
  </button>
)}
                              
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FULLSCREEN IMAGE PREVIEW */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 text-white text-3xl font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================================
   SMALL INFO ROW COMPONENT
=========================================================== */
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value ?? "-"}</span>
    </div>
  );
}
