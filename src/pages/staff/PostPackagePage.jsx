import React, { useEffect, useState } from "react";
import api from "../../configs/api";
import { useNavigate } from "react-router-dom";

export default function PostPackagePage() {
  const navigate = useNavigate();

  // QUERY STATE
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("ASC");

  // LIST & DETAIL STATE
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingList, setLoadingList] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // DATE FORMAT
  const fmt = (v) => (v ? new Date(v).toLocaleString() : "-");

  // ============================
  // FETCH LIST
  // ============================
  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await api.get(
        `/PostPackage/get-all?pageNumber=${pageNumber}&pageSize=${pageSize}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );

      if (res.data?.isSuccess) {
        setPosts(res.data.result.data);
        setPagination(res.data.result);

        if (!selectedId && res.data.result.data.length > 0) {
          setSelectedId(res.data.result.data[0].postPackageId);
        }
      }
    } finally {
      setLoadingList(false);
    }
  };

  // ============================
  // FETCH DETAIL
  // ============================
  const fetchDetail = async (id) => {
    if (!id) return;

    setLoadingDetail(true);
    try {
      const res = await api.get(`/PostPackage/get-details/${id}`);
      if (res.data?.isSuccess) setDetail(res.data.result);
    } finally {
      setLoadingDetail(false);
    }
  };

  // LOAD LIST WHEN filters change
  useEffect(() => {
    fetchList();
  }, [pageNumber, search, sortBy, sortOrder]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm text-gray-500">Staff / Post Packages</div>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            Post Package Management
          </h1>
        </div>

        <button
          onClick={() => navigate("/staff")}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex items-center gap-4">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search title, provider, route..."
          value={search}
          onChange={(e) => {
            setPageNumber(1);
            setSearch(e.target.value);
          }}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />

        {/* SORT FIELD */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">Sort By</option>
          <option value="title">Title</option>
          <option value="created">Created Date</option>
          <option value="price">Offered Price</option>
          <option value="provider">Provider Name</option>
        </select>

        {/* SORT ORDER */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="ASC">ASC</option>
          <option value="DESC">DESC</option>
        </select>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL */}
        <div className="bg-white rounded-xl shadow h-[720px] border flex flex-col overflow-hidden">

          {/* TITLE */}
          <div className="px-5 py-4 border-b bg-gray-50 font-semibold">
            All Post Packages
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto divide-y">
            {loadingList ? (
              <p className="p-4 text-gray-500 text-sm">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No data found.</p>
            ) : (
              posts.map((p) => {
                const active = p.postPackageId === selectedId;
                return (
                  <button
                    key={p.postPackageId}
                    onClick={() => setSelectedId(p.postPackageId)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 ${
                      active
                        ? "bg-indigo-50 border-l-4 border-indigo-500"
                        : ""
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Provider: {p.providerName || p.providerId}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* PAGINATION */}
          <div className="p-4 flex justify-between items-center border-t bg-gray-50">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(pageNumber - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Prev
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage || 1}
            </span>

            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPageNumber(pageNumber + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT DETAIL PANEL */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold mb-4">Post Package Detail</h2>

          {loadingDetail ? (
            <p className="text-gray-500">Loading detail...</p>
          ) : !detail ? (
            <p className="text-gray-500">Select a post package.</p>
          ) : (
            <div className="space-y-4 text-sm">

              <div>
                <div className="text-xs text-gray-500">Title</div>
                <div className="font-medium text-gray-900">{detail.title}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Description</div>
                <div>{detail.description || "-"}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Provider</div>
                  <div>{detail.provider?.fullName}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <span className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-700">
                    {detail.status}
                  </span>
                </div>
              </div>

              {/* LOCATIONS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Start Location</div>
                  <div>{detail.shippingRoute?.startLocation?.address}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">End Location</div>
                  <div>{detail.shippingRoute?.endLocation?.address}</div>
                </div>
              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Expected Pickup</div>
                  <div>{fmt(detail.shippingRoute?.expectedPickupDate)}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Expected Delivery</div>
                  <div>{fmt(detail.shippingRoute?.expectedDeliveryDate)}</div>
                </div>
              </div>

              {/* IMAGES */}
              {detail.packages?.length > 0 &&
                detail.packages[0].packageImages?.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Images</div>
                    <div className="flex gap-3 flex-wrap">
                      {detail.packages[0].packageImages.map((img) => (
                        <img
                          key={img.packageImageId}
                          src={img.imageUrl}
                          className="w-24 h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
