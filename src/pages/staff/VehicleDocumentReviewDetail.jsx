import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../configs/api";

/* ===========================
   VERIFIED STATUS BADGE
=========================== */
function VerifyStatusBadge({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "PENDING_REVIEW":
      return <span className={`${base} bg-amber-50 text-amber-700`}>Pending review</span>;
    case "ACTIVE":
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>Active</span>;
    case "REJECTED":
      return <span className={`${base} bg-red-50 text-red-700`}>Rejected</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-700`}>{status || "N/A"}</span>;
  }
}

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

/* ===========================
   MAIN COMPONENT
=========================== */
export default function VehicleDocumentReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const canReview =
    detail && detail.status === "PENDING_REVIEW" && !submitting;

  /* ===========================
     FETCH DETAIL
  =========================== */
  const fetchDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/VehicleDocument/pending-reviews/${id}`);

      if (res.data?.isSuccess || res.data?.isSucess) {
        setDetail(res.data.result); // ✅ FIX ĐÚNG DTO CỦA BẠN
      } else {
        setError(res.data?.message || "Cannot load vehicle document detail");
      }
    } catch (err) {
      console.error(err);
      setError("Error while fetching vehicle document detail.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleOpenImage = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ===========================
     SUBMIT REVIEW
  =========================== */
  const handleSubmitReview = async (isApproved) => {
  if (!detail?.vehicleDocumentId) return;

  if (!isApproved && !rejectReason.trim()) {
    alert("Vui lòng nhập lý do từ chối.");
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      documentId: detail.vehicleDocumentId,   // ⭐ SỬA KEY CHUẨN
      isApproved,
      rejectReason: isApproved ? null : rejectReason.trim(),
    };

    const res = await api.post(`/VehicleDocument/review`, payload);

    if (res.data?.isSuccess) {
      alert(res.data.message || "Review successfully.");
      navigate("/staff/vehicle-document-reviews");
    } else {
      alert(res.data?.message || "Review failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Error while submitting review.");
  }

  setSubmitting(false);
};

  /* ===========================
     RENDER
  =========================== */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Staff / Vehicle Document Verification / Detail
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Vehicle Document Review Detail
            </h1>
          </div>

          <button
            onClick={() => navigate("/staff/vehicle-document-reviews")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to list
          </button>
        </div>

        {loading && <p className="text-gray-600 text-sm">Loading document detail...</p>}
        {error && !loading && <p className="text-sm text-red-600 mb-3">⚠ {error}</p>}

        {!loading && !error && detail && (
          <>
            {/* DOCUMENT INFO */}
            <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-2">
              <p><b>Document Type:</b> {detail.documentType}</p>
              <p><b>Status:</b> <VerifyStatusBadge status={detail.status} /></p>
              <p><b>Created:</b> {formatDateTime(detail.createdAt)}</p>
              <p><b>Expire:</b> {formatDateTime(detail.expirationDate)}</p>

              {detail.adminNotes && (
                <p><b>Admin Notes:</b> {detail.adminNotes}</p>
              )}
            </div>

            {/* IMAGES */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold mb-2">Front Image</h2>
                {detail.frontDocumentUrl ? (
                  <img
                    src={detail.frontDocumentUrl}
                    alt="Front"
                    className="w-full rounded border cursor-pointer"
                    onClick={() => handleOpenImage(detail.frontDocumentUrl)}
                  />
                ) : (
                  <p className="text-gray-500">No front image</p>
                )}
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold mb-2">Back Image</h2>
                {detail.backDocumentUrl ? (
                  <img
                    src={detail.backDocumentUrl}
                    alt="Back"
                    className="w-full rounded border cursor-pointer"
                    onClick={() => handleOpenImage(detail.backDocumentUrl)}
                  />
                ) : (
                  <p className="text-gray-500">No back image</p>
                )}
              </div>
            </div>

            {/* DECISION */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Staff Decision</h2>

              {detail.status !== "PENDING_REVIEW" && (
                <p className="mb-3 text-sm text-amber-700">
                  Tài liệu này đã được xử lý. Không thể thay đổi.
                </p>
              )}

              <div className="flex gap-3 mb-3">
                <button
                  disabled={!canReview}
                  onClick={() => handleSubmitReview(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-40"
                >
                  Approve
                </button>

                <button
                  disabled={!canReview}
                  onClick={() => setDecision("reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-40"
                >
                  Reject
                </button>
              </div>

              {decision === "reject" && (
                <>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="Nhập lý do từ chối..."
                  />
                  <div className="mt-2">
                    <button
                      disabled={!canReview}
                      onClick={() => handleSubmitReview(false)}
                      className="px-4 py-2 bg-red-600 text-white rounded"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
