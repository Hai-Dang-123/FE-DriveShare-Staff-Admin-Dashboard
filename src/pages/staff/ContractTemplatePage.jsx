// src/pages/staff/ContractTemplatePage.jsx
import React, { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

const CONTRACT_TYPES = [
  { value: "PROVIDER_CONTRACT", label: "Provider Contract" },
  { value: "DRIVER_CONTRACT", label: "Driver Contract" },
];

// Small helper icon container
const IconCircle = ({ children, color = "bg-indigo-100 text-indigo-600" }) => (
  <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center`}>
    {children}
  </div>
);

export default function ContractTemplatePage() {
  const navigate = useNavigate();

  // ===================== STATE: TEMPLATE LIST + DETAIL =====================
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ===================== STATE: TEMPLATE FORM (CREATE/EDIT) =================
  const [tplMode, setTplMode] = useState("create"); // 'create' | 'edit'
  const [tplName, setTplName] = useState("");
  const [tplVersion, setTplVersion] = useState("");
  const [tplType, setTplType] = useState("PROVIDER_CONTRACT");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // ===================== STATE: TERM MODAL ================================
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [termMode, setTermMode] = useState("create"); // 'create' | 'edit'
  const [termId, setTermId] = useState(null);
  const [termContent, setTermContent] = useState("");
  const [termOrder, setTermOrder] = useState("");
  const [savingTerm, setSavingTerm] = useState(false);

  // ===================== STATE: ALERTS ====================================
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setError(null);
  };

  const showError = (msg) => {
    setError(msg);
    setMessage(null);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // ===================== API CALLS: TEMPLATE ==============================

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get("ContractTemplate/getAll");
      const data = res?.data;
      if (data?.isSuccess && Array.isArray(data.result)) {
        setTemplates(data.result);
        // if nothing selected -> select first
        if (!selectedTemplateId && data.result.length > 0) {
          setSelectedTemplateId(data.result[0].contractTemplateId);
        }
      } else {
        showError(data?.message || "Cannot load contract templates");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchTemplateDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await api.get(`ContractTemplate/getById/${id}`);
      const data = res?.data;
      if (data?.isSuccess && data.result) {
        setSelectedTemplate(data.result);

        // fill form for edit mode
        setTplMode("edit");
        setTplName(data.result.contractTemplateName || "");
        setTplVersion(data.result.version || "");
        setTplType(data.result.type || "PROVIDER_CONTRACT");
      } else {
        showError(data?.message || "Cannot load template detail");
        setSelectedTemplate(null);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error loading template detail");
      setSelectedTemplate(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const resetTemplateForm = () => {
    setTplMode("create");
    setTplName("");
    setTplVersion("");
    setTplType("PROVIDER_CONTRACT");
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (savingTemplate) return;

    if (!tplName.trim()) return showError("Template name is required");
    if (!tplVersion.trim()) return showError("Version is required");

    setSavingTemplate(true);
    try {
      const formData = new FormData();
      formData.append("ContractTemplateName", tplName);
      formData.append("Version", tplVersion);
      formData.append("Type", tplType);

      let res;
      if (tplMode === "create") {
        res = await api.post("ContractTemplate/create", formData);
      } else {
        formData.append("ContractTemplateId", selectedTemplateId);
        res = await api.put("ContractTemplate/update", formData);
      }

      const data = res?.data;
      if (data?.isSuccess) {
        showMessage(
          data.message ||
            (tplMode === "create"
              ? "Created contract template successfully"
              : "Updated contract template successfully")
        );
        await fetchTemplates();
        if (tplMode === "create") {
          resetTemplateForm();
        } else if (selectedTemplateId) {
          await fetchTemplateDetail(selectedTemplateId);
        }
      } else {
        showError(data?.message || "Save contract template failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error saving template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTemplateDelete = async () => {
    if (!selectedTemplateId) return;
    const ok = window.confirm(
      "Are you sure you want to delete this contract template?"
    );
    if (!ok) return;

    try {
      const res = await api.delete(
        `ContractTemplate/delete/${selectedTemplateId}`
      );
      const data = res?.data;
      if (data?.isSuccess) {
        showMessage(data.message || "Template deleted successfully");
        setSelectedTemplateId(null);
        setSelectedTemplate(null);
        resetTemplateForm();
        fetchTemplates();
      } else {
        showError(data?.message || "Delete template failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error deleting template");
    }
  };

  // ===================== API CALLS: TERM ==================================

  const openCreateTermModal = () => {
  if (!selectedTemplateId) {
    showError("Please select a contract template first");
    return;
  }

  // Lấy Order cao nhất từ danh sách terms hiện có
  const maxOrder = selectedTemplate?.contractTerms?.length
    ? Math.max(...selectedTemplate.contractTerms.map(t => t.order))
    : 0;

  // Setup form
  setTermMode("create");
  setTermId(null);
  setTermContent("");
  setTermOrder(maxOrder + 1); // 🔥 Tự set luôn giá trị order mới

  setTermModalOpen(true);
};


  const openEditTermModal = (term) => {
    setTermMode("edit");
    setTermId(term.contractTermId);
    setTermContent(term.content);
    setTermOrder(term.order);
    setTermModalOpen(true);
  };

  const closeTermModal = () => {
    if (savingTerm) return;
    setTermModalOpen(false);
    setTermId(null);
    setTermContent("");
    setTermOrder("");
  };

  const handleTermSubmit = async (e) => {
    e.preventDefault();
    if (savingTerm) return;

    if (!termContent.trim()) return showError("Term content is required");
    if (!termOrder || Number(termOrder) <= 0)
      return showError("Order must be a positive number");

    setSavingTerm(true);
    try {
      const formData = new FormData();
      formData.append("Content", termContent);
      formData.append("Order", termOrder);

      let res;
      if (termMode === "create") {
        formData.append("ContractTemplateId", selectedTemplateId);
        res = await api.post("ContractTerm/create", formData);
      } else {
        formData.append("ContractTermId", termId);
        res = await api.put("ContractTerm/update", formData);
      }

      const data = res?.data;
      if (data?.isSuccess) {
        showMessage(
          data.message ||
            (termMode === "create"
              ? "Created term successfully"
              : "Updated term successfully")
        );
        closeTermModal();
        if (selectedTemplateId) {
          await fetchTemplateDetail(selectedTemplateId);
        }
      } else {
        showError(data?.message || "Save term failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error saving term");
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async (term) => {
    const ok = window.confirm(`Delete term: "${term.content}"?`);
    if (!ok) return;

    try {
      const res = await api.delete(
        `ContractTerm/delete/${term.contractTermId}`
      );
      const data = res?.data;
      if (data?.isSuccess) {
        showMessage(data.message || "Term deleted successfully");
        if (selectedTemplateId) {
          await fetchTemplateDetail(selectedTemplateId);
        }
      } else {
        showError(data?.message || "Delete term failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Error deleting term");
    }
  };

  // ===================== EFFECTS ==========================================
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplateDetail(selectedTemplateId);
    } else {
      setSelectedTemplate(null);
      resetTemplateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId]);

  // ===================== RENDER ===========================================
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER & BREADCRUMB */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-slate-500">
              Staff Dashboard / Contract Templates
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Contract Templates
            </h1>
            <p className="text-slate-500 mt-1">
              Manage base contract templates and their terms.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/staff")}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* MAIN 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT: TEMPLATE LIST */}
          <section className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCircle>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </IconCircle>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Templates
                  </h2>
                  <p className="text-xs text-slate-500">
                    {loadingTemplates
                      ? "Loading templates..."
                      : `${templates.length} templates`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId(null);
                  setSelectedTemplate(null);
                  resetTemplateForm();
                }}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                + New
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
              {templates.length === 0 && !loadingTemplates && (
                <div className="px-5 py-8 text-sm text-slate-500 text-center">
                  No contract templates. Click “New” to create one.
                </div>
              )}

              {templates.map((tpl) => {
                const active = tpl.contractTemplateId === selectedTemplateId;
                return (
                  <button
                    key={tpl.contractTemplateId}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.contractTemplateId)}
                    className={`w-full text-left px-5 py-3.5 flex flex-col gap-1 transition-colors ${
                      active
                        ? "bg-indigo-50/80 border-l-4 border-indigo-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          active ? "text-indigo-700" : "text-slate-900"
                        }`}
                      >
                        {tpl.contractTemplateName}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        v{tpl.version}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {tpl.type === "PROVIDER_CONTRACT"
                          ? "Provider Contract"
                          : tpl.type === "DRIVER_CONTRACT"
                          ? "Driver Contract"
                          : tpl.type}
                      </span>
                      <span>{formatDate(tpl.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RIGHT: TEMPLATE DETAIL + TERMS */}
          <section className="lg:col-span-2 space-y-6">

            {/* TEMPLATE FORM CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {tplMode === "create"
                      ? "Create Contract Template"
                      : "Edit Contract Template"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define base information for this template.
                  </p>
                </div>

                {tplMode === "edit" && (
                  <button
                    type="button"
                    onClick={resetTemplateForm}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Switch to Create Mode
                  </button>
                )}
              </div>

              <form
                onSubmit={handleTemplateSubmit}
                className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Hợp đồng Vận chuyển (Owner - Provider)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={tplVersion}
                    onChange={(e) => setTplVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. 1.0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={tplType}
                    onChange={(e) => setTplType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-400">
                    {selectedTemplate && tplMode === "edit" && (
                      <>
                        Created at:{" "}
                        <span className="font-medium text-slate-500">
                          {formatDate(selectedTemplate.createdAt)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {tplMode === "edit" && (
                      <button
                        type="button"
                        onClick={handleTemplateDelete}
                        className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete Template
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {savingTemplate
                        ? tplMode === "create"
                          ? "Creating..."
                          : "Saving..."
                        : tplMode === "create"
                        ? "Create Template"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* TERMS CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Contract Terms
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Terms attached to this template, ordered by “Order”.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateTermModal}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  + Add Term
                </button>
              </div>

              {loadingDetail ? (
                <div className="px-6 py-8 text-sm text-slate-500">
                  Loading template terms...
                </div>
              ) : !selectedTemplate ? (
                <div className="px-6 py-8 text-sm text-slate-500">
                  Please select a template on the left to view its terms.
                </div>
              ) : (selectedTemplate.contractTerms || []).length === 0 ? (
                <div className="px-6 py-8 text-sm text-slate-500">
                  No terms for this template. Click “Add Term” to create one.
                </div>
              ) : (
                <div className="px-6 py-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left w-16">Order</th>
                        <th className="px-4 py-2 text-left">Content</th>
                        <th className="px-4 py-2 text-right w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTemplate.contractTerms
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((term) => (
                          <tr key={term.contractTermId}>
                            <td className="px-4 py-2 text-slate-700">
                              {term.order}
                            </td>
                            <td className="px-4 py-2 text-slate-800">
                              {term.content}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => openEditTermModal(term)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTerm(term)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ======================== TERM MODAL ======================== */}
      {termModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCircle color="bg-emerald-100 text-emerald-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                </IconCircle>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {termMode === "create" ? "Add Term" : "Edit Term"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {termMode === "create"
                      ? "Create new term for current template."
                      : "Update selected term."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeTermModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <form onSubmit={handleTermSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  value={termContent}
                  onChange={(e) => setTermContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Bên A có trách nhiệm cung cấp xe đạt chuẩn..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Order
                  </label>
                  <input
  type="number"
  value={termOrder}
  disabled
  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
/>

                </div>
                <p className="text-xs text-slate-500">
                  Terms are displayed sorted by order (1, 2, 3…).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={savingTerm}
                  onClick={closeTermModal}
                  className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTerm}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingTerm
                    ? termMode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : termMode === "create"
                    ? "Create Term"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
