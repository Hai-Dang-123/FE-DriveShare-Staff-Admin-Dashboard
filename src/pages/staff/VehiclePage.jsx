// src/pages/staff/VehiclePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const PAGE_SIZE = 10;

export default function VehiclePage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [pageNumber, setPageNumber] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ========= SEARCH & SORT ==========
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("ASC");

  // ========== API CALLS ==========

  const fetchVehicles = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/Vehicle", {
        params: {
          pageNumber,
          pageSize: PAGE_SIZE,
          search,
          sortBy,
          sortOrder,
        },
      });

      if (res.data?.isSuccess && res.data?.result) {
        const pg = res.data.result;
        setVehicles(pg.data || []);
        setPagination(pg);

        if (!selectedVehicleId && pg.data?.length > 0) {
          const id = pg.data[0].vehicleId;
          setSelectedVehicleId(id);
          fetchVehicleDetail(id);
        }
      }
    } catch (err) {
      console.error("Error fetching vehicles", err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchVehicleDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await api.get(`/Vehicle/${id}`);
      if (res.data?.isSuccess) {
        setSelectedVehicle(res.data.result);
      } else setSelectedVehicle(null);
    } catch {
      setSelectedVehicle(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, search, sortBy, sortOrder]);

  // ================= UI HELPERS =================
  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-700";
      case "DELETED":
        return "bg-gray-300 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d) ? "-" : d.toLocaleDateString();
  };

  // ================ RENDER UI =================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500">Staff / Vehicles</div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        </div>

        <button
          onClick={() => navigate("/staff")}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT LIST */}
        <div className="col-span-5 bg-white rounded-xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">All Vehicles</h2>
            <span className="text-sm text-gray-500">
              {pagination.totalCount} total
            </span>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search plate / model / brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm mb-3"
          />

          {/* SORT */}
          <div className="flex items-center gap-2 mb-3">
            <select
              className="border px-2 py-1 rounded text-sm"
              value={sortBy || ""}
              onChange={(e) => setSortBy(e.target.value || null)}
            >
              <option value="">Sort by...</option>
              <option value="brand">Brand</option>
              <option value="model">Model</option>
              <option value="year">Year</option>
              <option value="payload">Payload</option>
              <option value="volume">Volume</option>
              <option value="createdAt">Created At</option>
            </select>

            <select
              className="border px-2 py-1 rounded text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loadingList ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No vehicles found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Plate</th>
                    <th className="px-3 py-2 text-left">Model/Brand</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Owner</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr
                      key={v.vehicleId}
                      onClick={() => {
                        setSelectedVehicleId(v.vehicleId);
                        fetchVehicleDetail(v.vehicleId);
                      }}
                      className={`cursor-pointer border-t ${
                        selectedVehicleId === v.vehicleId
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 font-semibold">{v.plateNumber}</td>
                      <td className="px-3 py-2">
                        {v.model}
                        <div className="text-xs text-gray-500">
                          {v.brand} • {v.yearOfManufacture}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {v.vehicleType?.vehicleTypeName || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {v.owner?.companyName || v.owner?.fullName || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(
                            v.status
                          )}`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-end items-center gap-3 mt-3">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPageNumber((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: DETAIL */}
        <div className="col-span-7 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Vehicle Detail
          </h2>

          {loadingDetail ? (
            <div className="text-sm text-gray-500">Loading detail...</div>
          ) : !selectedVehicle ? (
            <div className="text-sm text-gray-500">Select a vehicle to view details.</div>
          ) : (
            <VehicleDetail selectedVehicle={selectedVehicle} formatDate={formatDate} statusColor={statusColor} />
          )}
        </div>
      </div>
    </div>
  );
}

function VehicleDetail({ selectedVehicle, formatDate, statusColor }) {
  return (
    <div className="space-y-6 text-sm">
      {/* Basic */}
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Basic Info</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label="Plate" value={selectedVehicle.plateNumber} />
          <InfoRow
            label="Status"
            value={
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(selectedVehicle.status)}`}>
                {selectedVehicle.status}
              </span>
            }
          />
          <InfoRow label="Model" value={selectedVehicle.model} />
          <InfoRow label="Brand" value={selectedVehicle.brand} />
          <InfoRow label="Year" value={selectedVehicle.yearOfManufacture} />
          <InfoRow label="Color" value={selectedVehicle.color} />
          <InfoRow label="Payload (kg)" value={selectedVehicle.payloadInKg} />
          <InfoRow label="Volume (m³)" value={selectedVehicle.volumeInM3} />
        </div>
      </section>

      {/* Type */}
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Vehicle Type</h3>
        <div className="border p-3 rounded bg-gray-50">
          <div className="font-semibold">
            {selectedVehicle.vehicleType?.vehicleTypeName}
          </div>
          <div className="text-xs text-gray-600">{selectedVehicle.vehicleType?.description}</div>
        </div>
      </section>

      {/* Owner */}
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
        {selectedVehicle.owner ? (
          <div className="border p-3 rounded bg-gray-50">
            <div className="font-medium">{selectedVehicle.owner.fullName}</div>
            <div className="text-xs text-gray-600">{selectedVehicle.owner.companyName}</div>
          </div>
        ) : (
          "-"
        )}
      </section>

      {/* Images */}
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Images</h3>
        {selectedVehicle.imageUrls?.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {selectedVehicle.imageUrls.map((img) => (
              <div key={img.vehicleImageId} className="border rounded overflow-hidden">
                <img src={img.imageURL} className="w-full h-32 object-cover" />
              </div>
            ))}
          </div>
        ) : (
          "No images"
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-sm">{value ?? "-"}</span>
    </div>
  );
}
