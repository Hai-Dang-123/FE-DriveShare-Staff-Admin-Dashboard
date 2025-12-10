// ===============================
// VEHICLE DOCUMENT REVIEW DETAIL
// Đồng bộ 100% với UserDocument flow
// ===============================

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../configs/api";

/* BADGE STATUS */
function VerifyStatusBadge({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "PENDING_REVIEW":
      return <span className={`${base} bg-amber-50 text-amber-700`}>Pending review</span>;
    case "ACTIVE":
    case "APPROVED":
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>Approved</span>;
    case "REJECTED":
      return <span className={`${base} bg-red-50 text-red-700`}>Rejected</span>;
    default:
      return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
  }
}

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return d.toLocaleString();
};

export default function VehicleDocumentReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [decision, setDecision] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [previewUrl, setPreviewUrl] = useState(null);

  const canReview =
    detail?.status === "PENDING_REVIEW" && !submitting;

  // ===============================
  // FETCH DETAIL
  // ===============================
  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/VehicleDocument/pending-reviews/${id}`);

      if (res.data?.isSuccess) {
        setDetail(res.data.result);
      }
    } catch (err) {
      console.error(err);
      alert("Cannot load document detail");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // ===============================
  // SUBMIT REVIEW
  // ===============================
  const handleSubmit = async (isApproved) => {
    if (!detail?.vehicleDocumentId) return;

    if (!isApproved && !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        documentId: detail.vehicleDocumentId,
        isApproved,
        rejectReason: isApproved ? null : rejectReason.trim(),
      };

      const res = await api.post(`/VehicleDocument/review`, payload);

      if (res.data?.isSuccess) {
        alert("Review thành công!");
        navigate("/staff/vehicles"); // ✔ QUAY VỀ PAGE CHÍNH GIỐNG USER FLOW
      } else {
        alert(res.data?.message || "Review thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reviewing document");
    }

    setSubmitting(false);
  };

  // ===============================
  // RENDER UI
  // ===============================
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Staff / Vehicle Document / Review
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Vehicle Document Review Detail
            </h1>
          </div>

          <button
            onClick={() => navigate("/staff/vehicles")}
            className="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to list
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && detail && (
          <>
            {/* FULLSCREEN PREVIEW */}
            {previewUrl && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                <img src={previewUrl} className="max-w-[90%] max-h-[90%] rounded-xl" />
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="absolute top-5 right-5 text-white text-3xl font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* LEFT CARD */}
              <div className="bg-white shadow rounded-xl p-5">
                <h2 className="font-semibold text-lg mb-2">Document Info</h2>

                <p><b>Type:</b> {detail.documentType}</p>
                <p><b>Status:</b> <VerifyStatusBadge status={detail.status} /></p>
                <p><b>Created:</b> {formatDateTime(detail.createdAt)}</p>
                <p><b>Expire:</b> {formatDateTime(detail.expirationDate)}</p>
              </div>

              {/* IMAGE PREVIEW */}
              <div className="bg-white shadow rounded-xl p-5">
                <h2 className="font-semibold text-lg mb-2">Images</h2>

                <div className="space-y-4">

                  {/* FRONT */}
                  <div>
                    <p className="font-medium mb-1">Front</p>
                    <img
                      src={detail.frontDocumentUrl}
                      className="rounded border cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewUrl(detail.frontDocumentUrl)}
                    />
                  </div>

                  {/* BACK */}
                  {detail.backDocumentUrl && (
                    <div>
                      <p className="font-medium mb-1">Back</p>
                      <img
                        src={detail.backDocumentUrl}
                        className="rounded border cursor-pointer hover:opacity-90"
                        onClick={() => setPreviewUrl(detail.backDocumentUrl)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REVIEW ACTIONS */}
            <div className="bg-white shadow rounded-xl p-5">
              <h2 className="font-semibold text-lg mb-3">Staff Decision</h2>

              <div className="flex gap-3 mb-3">
                <button
                  disabled={!canReview}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded"
                >
                  Approve
                </button>

                <button
                  disabled={!canReview}
                  onClick={() => setDecision("reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Reject
                </button>
              </div>

              {decision === "reject" && (
                <>
                  <textarea
                    className="w-full border rounded p-2"
                    placeholder="Nhập lý do từ chối..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="mt-2">
                    <button
                      disabled={!canReview}
                      onClick={() => handleSubmit(false)}
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
