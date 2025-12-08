// src/pages/staff/DeliveryRecordTemplatePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliveryRecordTemplateService from "../../services/deliveryRecordTemplateService";
import DeliveryRecordTermService from "../../services/deliveryRecordTermService";

export default function DeliveryRecordTemplatePage() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [terms, setTerms] = useState([]);

  // Template form
  const [tplName, setTplName] = useState("");
  const [tplVersion, setTplVersion] = useState("");
  const [tplType, setTplType] = useState("PICKUP");
  const [mode, setMode] = useState("edit"); // "create" | "edit"

  // Term modal
  const [termModal, setTermModal] = useState(false);
  const [termMode, setTermMode] = useState("create"); // "create" | "edit"
  const [termContent, setTermContent] = useState("");
  const [termOrder, setTermOrder] = useState(1);
  const [editingTermId, setEditingTermId] = useState(null);

  // Message
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const showError = (m) => {
    setError(m);
    setMsg(null);
  };

  const showMsg = (m) => {
    setMsg(m);
    setError(null);
  };

  // ===== API CALLS =====

  const loadTemplates = async () => {
    try {
      const res = await DeliveryRecordTemplateService.getAll(1, 50);
      if (res.data?.isSuccess) {
        const list = res.data.result.data || [];
        setTemplates(list);

        // nếu chưa chọn template nào thì auto chọn thằng đầu tiên
        if (!selectedTemplateId && list.length > 0) {
          setSelectedTemplateId(list[0].deliveryRecordTemplateId);
        }
      } else {
        showError(res.data?.message || "Failed to load templates.");
      }
    } catch {
      showError("Failed to load templates.");
    }
  };

  const loadTemplateDetail = async (id) => {
    if (!id) return;
    try {
      const res = await DeliveryRecordTemplateService.getById(id);
      if (res.data?.isSuccess) {
        const tpl = res.data.result;
        setSelectedTemplate(tpl);

        setTplName(tpl.templateName);
        setTplVersion(tpl.version);
        setTplType(tpl.type);
        setMode("edit");
      } else {
        showError(res.data?.message || "Failed to load template detail.");
      }
    } catch {
      showError("Failed to load template detail.");
    }
  };

  const loadTerms = async (templateId) => {
    if (!templateId) {
      setTerms([]);
      return;
    }

    try {
      // giả sử service có method: getByTemplate(templateId, page, pageSize)
      const res = await DeliveryRecordTermService.getByTemplate(
        templateId,
        1,
        50
      );
      if (res.data?.isSuccess) {
        const data = res.data.result.data || [];
        setTerms(data);
      } else {
        showError(res.data?.message || "Failed to load terms.");
      }
    } catch {
      showError("Failed to load terms.");
    }
  };

  // ===== EFFECT =====
  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateDetail(selectedTemplateId);
      loadTerms(selectedTemplateId);
    } else {
      setSelectedTemplate(null);
      setTerms([]);
    }
  }, [selectedTemplateId]);

  // ===== TEMPLATE CRUD =====

  const handleNewTemplate = () => {
    setMode("create");
    setSelectedTemplate(null);
    setSelectedTemplateId(null);
    setTplName("");
    setTplVersion("");
    setTplType("PICKUP");
    setTerms([]);
  };

  const saveTemplate = async (e) => {
    e.preventDefault();

    if (!tplName.trim()) {
      showError("Template name is required.");
      return;
    }

    const body = {
      templateName: tplName,
      version: tplVersion,
      type: tplType,
    };

    try {
      let res;
      if (mode === "create") {
        res = await DeliveryRecordTemplateService.create(body);
      } else {
        res = await DeliveryRecordTemplateService.update(
          selectedTemplateId,
          body
        );
      }

      if (res.data?.isSuccess) {
        showMsg(
          mode === "create"
            ? "Template created successfully."
            : "Template updated successfully."
        );

        const newId =
          mode === "create"
            ? res.data.result?.deliveryRecordTemplateId || selectedTemplateId
            : selectedTemplateId;

        await loadTemplates();
        if (newId) {
          setSelectedTemplateId(newId);
        }
      } else {
        showError(res.data?.message || "Failed to save template.");
      }
    } catch {
      showError("Failed to save template.");
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!window.confirm("Delete this template?")) return;

    try {
      const res = await DeliveryRecordTemplateService.delete(
        selectedTemplateId
      );
      if (res.data?.isSuccess) {
        showMsg("Template deleted.");
        setSelectedTemplate(null);
        setSelectedTemplateId(null);
        setTerms([]);
        setMode("create");
        await loadTemplates();
      } else {
        showError(res.data?.message || "Failed to delete template.");
      }
    } catch {
      showError("Failed to delete template.");
    }
  };

  // ===== TERM MODAL LOGIC =====

  const openCreateTerm = () => {
    if (!selectedTemplateId) {
      showError("Please create & save template before adding terms.");
      return;
    }

    setTermMode("create");
    setTermContent("");
    setEditingTermId(null);

    const maxOrder =
      terms.length > 0
        ? Math.max(...terms.map((t) => t.displayOrder || 0))
        : 0;

    setTermOrder(maxOrder + 1);
    setTermModal(true);
  };

  const openEditTerm = (term) => {
    setTermMode("edit");
    setTermContent(term.content);
    setTermOrder(term.displayOrder);
    setEditingTermId(term.deliveryRecordTermId);
    setTermModal(true);
  };

  const saveTerm = async (e) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      showError("Template not selected.");
      return;
    }
    if (!termContent.trim()) {
      showError("Term content is required.");
      return;
    }

    const body = {
      deliveryRecordTemplateId: selectedTemplateId,
      content: termContent,
      displayOrder: termOrder, // luôn giữ nguyên, auto +1 khi create
    };

    try {
      let res;
      if (termMode === "create") {
        res = await DeliveryRecordTermService.create(body);
      } else {
        res = await DeliveryRecordTermService.update(editingTermId, body);
      }

      if (res.data?.isSuccess) {
        showMsg(termMode === "create" ? "Term added." : "Term updated.");
        setTermModal(false);
        await loadTerms(selectedTemplateId);
      } else {
        showError(res.data?.message || "Failed to save term.");
      }
    } catch {
      showError("Failed to save term.");
    }
  };

  const deleteTerm = async (term) => {
    if (!window.confirm("Delete this term?")) return;

    try {
      const res = await DeliveryRecordTermService.delete(
        term.deliveryRecordTermId
      );
      if (res.data?.isSuccess) {
        showMsg("Term deleted.");
        await loadTerms(selectedTemplateId);
      } else {
        showError(res.data?.message || "Failed to delete term.");
      }
    } catch {
      showError("Failed to delete term.");
    }
  };

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-slate-50 px-10 py-8">
      {/* BREADCRUMB + HEADER */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          Staff Dashboard / <span className="text-gray-700 font-medium">Delivery Record Templates</span>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery Record Templates
          </h1>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        <p className="text-gray-500 mt-2 text-sm">
          Manage delivery record templates and their terms.
        </p>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {msg}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: TEMPLATE LIST */}
        <div className="col-span-4">
          <div className="rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h10M4 18h6"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Templates</div>
                  <div className="text-xs text-gray-500">
                    {templates.length} templates
                  </div>
                </div>
              </div>

              <button
                onClick={handleNewTemplate}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                + New
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
              {templates.map((tpl) => (
                <button
                  key={tpl.deliveryRecordTemplateId}
                  onClick={() =>
                    setSelectedTemplateId(tpl.deliveryRecordTemplateId)
                  }
                  className={`w-full text-left px-5 py-3 text-sm transition ${
                    tpl.deliveryRecordTemplateId === selectedTemplateId
                      ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-800">
                    {tpl.templateName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span>v{tpl.version}</span>
                    <span>•</span>
                    <span>{tpl.type}</span>
                  </div>
                </button>
              ))}

              {templates.length === 0 && (
                <div className="px-5 py-4 text-sm text-gray-500">
                  No templates yet. Click “New” to create one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: TEMPLATE DETAIL + TERMS */}
        <div className="col-span-8 space-y-6">
          {/* TEMPLATE FORM CARD */}
          <div className="rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {mode === "create"
                    ? "Create Delivery Record Template"
                    : "Edit Delivery Record Template"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Define base information for this template.
                </div>
              </div>
            </div>

            <form className="px-6 py-5 space-y-4" onSubmit={saveTemplate}>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Ex: Biên bản Giao hàng (Tài xế nhận hàng)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={tplVersion}
                    onChange={(e) => setTplVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={tplType}
                    onChange={(e) => setTplType(e.target.value)}
                  >
                    <option value="PICKUP">Pickup</option>
                    <option value="DROPOFF">Dropoff</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={deleteTemplate}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                  >
                    Delete Template
                  </button>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  {mode === "create" ? "Create Template" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* TERMS CARD */}
          <div className="rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Delivery Record Terms
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Terms attached to this template, ordered by “Order”.
                </div>
              </div>

              <button
                onClick={openCreateTerm}
                disabled={!selectedTemplateId}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedTemplateId
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                + Add Term
              </button>
            </div>

            <div className="px-6 py-4">
              {(!terms || terms.length === 0) && (
                <div className="text-sm text-gray-500">
                  No terms yet. Click “Add Term”.
                </div>
              )}

              {terms && terms.length > 0 && (
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold border-b">
                        ORDER
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold border-b">
                        CONTENT
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold border-b">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms
                      .slice()
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((term) => (
                        <tr key={term.deliveryRecordTermId} className="border-t">
                          <td className="px-3 py-2 align-top text-gray-700">
                            {term.displayOrder}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-800">
                            {term.content}
                          </td>
                          <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                            <button
                              className="text-indigo-600 hover:underline text-xs mr-3"
                              onClick={() => openEditTerm(term)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:underline text-xs"
                              onClick={() => deleteTerm(term)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TERM MODAL */}
      {termModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {termMode === "create" ? "Add Delivery Record Term" : "Edit Delivery Record Term"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  This term will be shown in the delivery record for this template.
                </div>
              </div>
              <button
                onClick={() => setTermModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form className="px-6 py-5 space-y-4" onSubmit={saveTerm}>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={termContent}
                  onChange={(e) => setTermContent(e.target.value)}
                  placeholder="Nội dung điều khoản..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-700"
                  value={termOrder}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Order is auto-increment and cannot be changed.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setTermModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  {termMode === "create" ? "Save Term" : "Update Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
