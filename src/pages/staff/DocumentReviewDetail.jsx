// src/pages/staff/DocumentReviewDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../configs/api";

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
        <span className={`${base} bg-gray-100 text-gray-700`}>Inactive</span>
      );
    default:
      return (
        <span className={`${base} bg-slate-100 text-slate-700`}>
          {status || "N/A"}
        </span>
      );
  }
}

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
};

export default function DocumentReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // NEW: Fullscreen Image Preview
  const [previewUrl, setPreviewUrl] = useState(null);

  const canReview =
    detail && detail.status === "PENDING_REVIEW" && !submitting;

  const fetchDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/UserDocument/pending-reviews/${id}`);

      if (res.data?.isSuccess) {
        const result = res.data.result;
        setDetail(result);
      } else {
        setError(res.data?.message || "Cannot load document detail");
      }
    } catch (err) {
      console.error(err);
      setError("Error while fetching document detail.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmitReview = async (isApproved) => {
    if (!detail?.userDocumentId) return;

    if (!isApproved && !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        userDocumentId: detail.userDocumentId,
        isApproved,
        rejectionReason: isApproved ? null : rejectReason.trim(),
      };

      const res = await api.post(`/UserDocument/review`, payload);

      if (res.data?.isSuccess) {
        alert(res.data.message || "Review successfully.");
        navigate("/staff/document-reviews");
      } else {
        alert(res.data?.message || "Review failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error while submitting review.");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Staff / Document Verification / Detail
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Document Review Detail
            </h1>
          </div>

          <button
            onClick={() => navigate("/staff/document-reviews")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to list
          </button>
        </div>

        {loading && (
          <p className="text-gray-600 text-sm">Loading document detail...</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-600 mb-3">⚠ {error}</p>
        )}

        {!loading && !error && detail && (
          <>
            {/* FULLSCREEN IMAGE PREVIEW */}
            {previewUrl && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-[95%] max-h-[95%] rounded-lg shadow-xl"
                />
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="absolute top-5 right-5 text-white text-3xl font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* LEFT COLUMN: USER INFO */}
              <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    User Information
                  </h2>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Name: </span>
                    {detail.userName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email: </span>
                    {detail.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">UserId: </span>
                    {detail.userId || "N/A"}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Document
                  </h3>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Type: </span>
                    {detail.documentType || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status: </span>
                    <VerifyStatusBadge status={detail.status} />
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Created: </span>
                    {formatDateTime(detail.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Last updated: </span>
                    {formatDateTime(detail.lastUpdatedAt)}
                  </p>
                </div>
              </div>

              {/* CENTER COLUMN — IMAGES */}
              <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Images
                </h2>

                <div className="space-y-6">

                  {/* FRONT IMAGE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        Front Image
                      </span>
                      {detail.frontImageUrl && (
                        <button
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => setPreviewUrl(detail.frontImageUrl)}
                        >
                          View fullscreen
                        </button>
                      )}
                    </div>

                    {detail.frontImageUrl ? (
                      <div className="overflow-hidden border rounded-lg bg-gray-50">
                        <img
                          src={detail.frontImageUrl}
                          alt="Front"
                          className="w-full max-h-[750px] object-contain cursor-zoom-in hover:scale-[1.05] transition-transform duration-300"
                          onClick={() => setPreviewUrl(detail.frontImageUrl)}
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-lg border border-dashed border-gray-300 py-10 text-center text-xs text-gray-500">
                        No front image
                      </div>
                    )}
                  </div>

                  {/* BACK IMAGE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        Back Image
                      </span>
                      {detail.backImageUrl && (
                        <button
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => setPreviewUrl(detail.backImageUrl)}
                        >
                          View fullscreen
                        </button>
                      )}
                    </div>

                    {detail.backImageUrl ? (
                      <div className="overflow-hidden border rounded-lg bg-gray-50">
                        <img
                          src={detail.backImageUrl}
                          alt="Back"
                          className="w-full max-h-[750px] object-contain cursor-zoom-in hover:scale-[1.05] transition-transform duration-300"
                          onClick={() => setPreviewUrl(detail.backImageUrl)}
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-lg border border-dashed border-gray-300 py-10 text-center text-xs text-gray-500">
                        No back image
                      </div>
                    )}
                  </div>

                  {/* PORTRAIT IMAGE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        Portrait Image
                      </span>
                      {detail.portraitImageUrl && (
                        <button
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => setPreviewUrl(detail.portraitImageUrl)}
                        >
                          View fullscreen
                        </button>
                      )}
                    </div>

                    {detail.portraitImageUrl ? (
                      <div className="flex justify-center">
                        <img
                          src={detail.portraitImageUrl}
                          alt="Portrait"
                          className="w-60 h-60 rounded-full border object-cover cursor-zoom-in hover:scale-[1.08] transition-transform duration-300"
                          onClick={() => setPreviewUrl(detail.portraitImageUrl)}
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-lg border border-dashed border-gray-300 py-6 text-center text-xs text-gray-500">
                        No portrait image
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN – OCR */}
              <div className="bg-white rounded-xl shadow p-5 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  OCR & Analysis
                </h2>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm text-gray-700">

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      OCR Result
                    </h3>
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {detail.analysisResult?.ocrName || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span>{" "}
                      {detail.analysisResult?.ocrId || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Birth Day:</span>{" "}
                      {detail.analysisResult?.ocrBirthDay || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Document Type:</span>{" "}
                      {detail.analysisResult?.documentType || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Is Valid:</span>{" "}
                      {String(
                        detail.analysisResult?.isValidDocument ?? "N/A"
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Overall Score:</span>{" "}
                      {detail.analysisResult?.overallScore ?? "N/A"}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Warnings
                    </h3>

                    {detail.analysisResult?.warnings &&
                    detail.analysisResult.warnings.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {detail.analysisResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No warnings.</p>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Integrity Flags
                    </h3>
                    <ul className="space-y-1 text-xs">
                      <li>
                        <span className="font-medium">Has Tampering:</span>{" "}
                        {String(
                          detail.analysisResult?.hasTampering ?? false
                        )}
                      </li>
                      <li>
                        <span className="font-medium">Is Expired:</span>{" "}
                        {String(detail.analysisResult?.isExpired ?? false)}
                      </li>
                      <li>
                        <span className="font-medium">Is Corner Cut:</span>{" "}
                        {String(detail.analysisResult?.isCornerCut ?? false)}
                      </li>
                      <li>
                        <span className="font-medium">Is Screen Recapture:</span>{" "}
                        {String(
                          detail.analysisResult?.isScreenRecapture ??
                            false
                        )}
                      </li>
                      <li>
                        <span className="font-medium">Data Mismatch:</span>{" "}
                        {String(
                          detail.analysisResult?.dataMismatch ?? false
                        )}
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* STAFF DECISION */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Staff Decision
              </h2>

              {detail.status !== "PENDING_REVIEW" && (
                <p className="mb-3 text-sm text-amber-700">
                  Tài liệu này đã được xử lý ({detail.status}). Bạn không thể
                  thay đổi quyết định nữa.
                </p>
              )}

              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex gap-3">
                  <button
                    disabled={!canReview}
                    onClick={() => {
                      setDecision("approve");
                      setRejectReason("");
                      handleSubmitReview(true);
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>

                  <button
                    disabled={!canReview}
                    onClick={() => setDecision("reject")}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>

                {decision === "reject" && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reject reason
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Nhập lý do từ chối để lưu trên hệ thống..."
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        disabled={!canReview}
                        onClick={() => handleSubmitReview(false)}
                        className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Confirm reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
