import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";
import CreateUserModal from "./CreateUserModal";

/* =======================
   ROLE OPTIONS (ADMIN)
======================= */
const ROLE_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Admin", value: "Admin" },
  { label: "Staff", value: "Staff" },
  { label: "Owner", value: "Owner" },
  { label: "Provider", value: "Provider" },
  { label: "Driver", value: "Driver" },
];

/* =======================
   SORT OPTIONS (GIỐNG STAFF)
======================= */
const SORT_OPTIONS = [
  { label: "Default (Full Name A → Z)", field: "fullname", direction: "ASC", value: "fullname_asc" },
  { label: "Full Name Z → A", field: "fullname", direction: "DESC", value: "fullname_desc" },
  { label: "Email A → Z", field: "email", direction: "ASC", value: "email_asc" },
  { label: "Email Z → A", field: "email", direction: "DESC", value: "email_desc" },
  { label: "Created At (Newest first)", field: "createdat", direction: "DESC", value: "createdat_desc" },
  { label: "Created At (Oldest first)", field: "createdat", direction: "ASC", value: "createdat_asc" },
];

/* =======================
   BADGES (GIỐNG STAFF)
======================= */
function RoleBadge({ role }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (role) {
    case "Admin": return <span className={`${base} bg-red-50 text-red-700`}>Admin</span>;
    case "Staff": return <span className={`${base} bg-purple-50 text-purple-700`}>Staff</span>;
    case "Owner": return <span className={`${base} bg-emerald-50 text-emerald-700`}>Owner</span>;
    case "Provider": return <span className={`${base} bg-indigo-50 text-indigo-700`}>Provider</span>;
    case "Driver": return <span className={`${base} bg-blue-50 text-blue-700`}>Driver</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-700`}>{role || "N/A"}</span>;
  }
}

function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "ACTIVE": return <span className={`${base} bg-green-50 text-green-700`}>ACTIVE</span>;
    case "INACTIVE": return <span className={`${base} bg-gray-100 text-gray-700`}>INACTIVE</span>;
    case "BANNED": return <span className={`${base} bg-red-50 text-red-700`}>BANNED</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
  }
}

function UserDocumentStatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "PENDING_REVIEW": return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
    case "ACTIVE": return <span className={`${base} bg-green-100 text-green-700`}>Active</span>;
    case "REJECTED": return <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-500`}>No docs</span>;
  }
}

function AvatarCell({ avatarUrl, fullName }) {
  const initials = fullName?.split(" ").map(p => p[0]).join("").toUpperCase() || "?";
  return avatarUrl ? (
    <img src={avatarUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover border" />
  ) : (
    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
}

/* =======================
   MAIN COMPONENT
======================= */
export default function AdminUserPage() {
  const navigate = useNavigate();
  const pendingRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("fullname");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [sortSelectValue, setSortSelectValue] = useState("fullname_asc");

  const [openCreate, setOpenCreate] = useState(false);

  // 🔥 ADDED — EDIT / DELETE USER
const [openEdit, setOpenEdit] = useState(false);
const [editForm, setEditForm] = useState({
  fullName: "",
  avatarUrl: "",
  licenseNumber: "",
  licenseClass: "",
  companyName: "",
  taxCode: "",
});

const [saving, setSaving] = useState(false);


  /* =======================
     FETCH USERS – GIỐNG STAFF
  ======================= */
  const fetchUsers = async () => {
    const params = new URLSearchParams({
      pageNumber: 1,
      pageSize: 500,
      search,
      sortField,
      sortDirection,
    });

    const res = await api.get(`/User?${params.toString()}`);
    if (!res.data?.isSuccess) return;

    const list = res.data.result?.data || [];

    const normalized = list.map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      avatarUrl: u.avatarUrl,
      status: u.status,
      roleName: typeof u.role === "string" ? u.role : u.role?.roleName,
      hasPendingDocumentRequest: u.hasPendingDocumentRequest === true,
      documentStatus: "NONE",
    }));

    setUsers(normalized);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [search, sortField, sortDirection]);

  /* =======================
     FILTER
  ======================= */
  const filteredUsers = users
    .filter(u => !roleFilter || u.roleName === roleFilter);

  /* =======================
     FETCH DOCUMENTS (KHI CLICK)
  ======================= */
  const fetchUserDocuments = async (userId, scroll = true) => {
    const res = await api.get(`/UserDocument/user/${userId}`);
    const docs = res.data?.result?.documents || [];

    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserDocuments(docs);

    let docStatus = "NONE";
    if (docs.length) {
      const pending = docs.find(d => d.status === "PENDING_REVIEW");
      docStatus = pending ? "PENDING_REVIEW" : docs[0].status;
    }

    setUsers(prev =>
      prev.map(u => u.userId === userId ? { ...u, documentStatus: docStatus } : u)
    );

    if (scroll) {
      const firstPending = docs.find(d => d.status === "PENDING_REVIEW");
      if (firstPending) {
        setTimeout(() => pendingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      }
    }
  };

  // 🔥 ADDED — OPEN EDIT MODAL
const openEditUser = () => {
  if (!selectedUser) return;

  setEditForm({
  fullName: selectedUser.fullName || "",
  avatarUrl: selectedUser.avatarUrl || "",
  licenseNumber: selectedUser.licenseNumber || "",
  licenseClass: selectedUser.licenseClass || "",
  companyName: selectedUser.companyName || "",
  taxCode: selectedUser.taxCode || "",
});

  setOpenEdit(true);
};

// 🔥 ADDED — SUBMIT UPDATE USER
const submitUpdateUser = async () => {
  try {
    setSaving(true);
    await api.put(`/User/${selectedUser.userId}`, editForm);
    setOpenEdit(false);
    fetchUsers();
  } catch (err) {
    alert("Update user failed");
  } finally {
    setSaving(false);
  }
};

// 🔥 ADDED — DELETE USER
const deleteUser = async () => {
  if (!selectedUser) return;
  if (!window.confirm("Bạn chắc chắn muốn xóa user này?")) return;

  try {
    await api.delete(`/User/${selectedUser.userId}`);
    setSelectedUser(null);
    fetchUsers();
  } catch (err) {
    alert("Delete user failed");
  }
};

  /* =======================
     UI
  ======================= */
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">User Management</h1>

          <div className="flex gap-3">
            {/* 🔥 KHÁC STAFF: CREATE BUTTON */}
            <button
              onClick={() => setOpenCreate(true)}
              className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm"
            >
              + Create User
            </button>

            <button
              onClick={() => navigate("/admin")}
              className="rounded-full border px-4 py-2 text-sm bg-white"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* GRID 2 CỘT – GIỐNG STAFF */}
        <div className="grid grid-cols-12 gap-6">

          {/* LEFT — USER LIST */}
          <div className="col-span-7">
            <div className="bg-white rounded-2xl p-5 shadow h-[700px] flex flex-col">

              {/* FILTER */}
              <div className="flex justify-between mb-4">
                <select
                  className="border rounded-full px-3 py-1.5 text-xs"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                <input
                  placeholder="Search name / email"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border rounded-full px-3 py-1.5 text-xs w-56"
                />
              </div>

              {/* TABLE */}
              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-xs text-gray-500">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(u => {
                      const isSelected = selectedUser?.userId === u.userId;
                      return (
                        <tr
                          key={u.userId}
                          className={`cursor-pointer
                            ${u.hasPendingDocumentRequest ? "bg-yellow-50 border-l-4 border-yellow-400" : ""}
                            ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}
                          `}
                          onClick={() => {
                            setSelectedUser(u);
                            fetchUserDocuments(u.userId, true);
                          }}
                        >
                          <td className="px-4 py-3 flex items-center gap-2">
                            <AvatarCell avatarUrl={u.avatarUrl} fullName={u.fullName} />
                            {u.fullName}
                          </td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3"><RoleBadge role={u.roleName} /></td>
                          <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                         
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT — DETAIL + DOCUMENTS (GIỐNG STAFF) */}
          <div className="col-span-5">
            <div className="bg-white rounded-2xl p-6 shadow h-[700px] flex flex-col">

              {!selectedUser ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Select a user to view details.
                </div>
              ) : (
                <>
                  {/* HEADER */}
                  <div className="flex gap-4 mb-5">
                    <AvatarCell avatarUrl={selectedUser.avatarUrl} fullName={selectedUser.fullName} />
                    <div>
                      <h2 className="text-xl font-semibold">{selectedUser.fullName}</h2>
                      <div className="flex gap-2 mt-2">
                        <RoleBadge role={selectedUser.roleName} />
                        <StatusBadge status={selectedUser.status} />
                        <UserDocumentStatusBadge status={selectedUser.documentStatus} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Email: <span className="font-medium">{selectedUser.email}</span> •
                        Phone: <span className="font-medium">{selectedUser.phoneNumber || "N/A"}</span>
                      </p>
                      {/* 🔥 ADDED — EDIT / DELETE BUTTONS */}
<div className="flex gap-2 mt-3">
  <button
    onClick={openEditUser}
    className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
  >
    Edit
  </button>

  <button
    onClick={deleteUser}
    className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
  >
    Delete
  </button>
</div>

                    </div>
                  </div>

                  {/* DOCUMENTS */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {userDocuments.length === 0 ? (
                      <div className="text-xs text-gray-500">No documents uploaded.</div>
                    ) : (
                      userDocuments.map(doc => {
                        const isPending = doc.status === "PENDING_REVIEW";
                        return (
                          <div
                            key={doc.userDocumentId}
                            ref={isPending ? pendingRef : null}
                            className={`rounded-xl border p-4 ${
                              isPending ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50"
                            }`}
                          >
                            <div className="flex justify-between mb-3">
                              <div>
                                <div className="text-sm font-semibold">{doc.documentType}</div>
                                <div className="text-xs text-gray-500">
                                  Created: {new Date(doc.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <UserDocumentStatusBadge status={doc.status} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <img
                                src={doc.frontImageUrl}
                                onClick={() => setPreviewImage(doc.frontImageUrl)}
                                className="cursor-pointer rounded border"
                              />
                              {doc.backImageUrl && (
                                <img
                                  src={doc.backImageUrl}
                                  onClick={() => setPreviewImage(doc.backImageUrl)}
                                  className="cursor-pointer rounded border"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <img src={previewImage} className="max-w-[90%] max-h-[90%] rounded-xl" />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white text-3xl"
          >
            ✕
          </button>
        </div>
      )}
{/* 🔥 ADDED — EDIT USER MODAL */}
{openEdit && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl p-6 w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Edit User</h2>
{/* ✅ AVATAR PREVIEW */}
{editForm.avatarUrl && (
  <div className="flex justify-center mb-3">
    <img
      src={editForm.avatarUrl}
      alt="avatar"
      className="h-24 w-24 rounded-full object-cover border"
    />
  </div>
)}

      <div className="space-y-3">
        <input
          value={editForm.fullName}
          onChange={(e) =>
            setEditForm({ ...editForm, fullName: e.target.value })
          }
          className="border rounded w-full px-3 py-2"
          placeholder="Full name"
        />

        <input
          value={editForm.avatarUrl}
          onChange={(e) =>
            setEditForm({ ...editForm, avatarUrl: e.target.value })
          }
          className="border rounded w-full px-3 py-2"
          placeholder="Avatar URL"
        />

        {/* 🔥 DRIVER FIELDS */}
{selectedUser?.roleName === "Driver" && (
  <>
    <input
      value={editForm.licenseNumber}
      onChange={(e) =>
        setEditForm({ ...editForm, licenseNumber: e.target.value })
      }
      className="border rounded w-full px-3 py-2"
      placeholder="License Number"
    />

    <input
      value={editForm.licenseClass}
      onChange={(e) =>
        setEditForm({ ...editForm, licenseClass: e.target.value })
      }
      className="border rounded w-full px-3 py-2"
      placeholder="License Class"
    />
  </>
)}
{/* 🔥 OWNER / PROVIDER FIELDS */}
{(selectedUser?.roleName === "Owner" || selectedUser?.roleName === "Provider") && (
  <>
    <input
      value={editForm.companyName}
      onChange={(e) =>
        setEditForm({ ...editForm, companyName: e.target.value })
      }
      className="border rounded w-full px-3 py-2"
      placeholder="Company Name"
    />

    <input
      value={editForm.taxCode}
      onChange={(e) =>
        setEditForm({ ...editForm, taxCode: e.target.value })
      }
      className="border rounded w-full px-3 py-2"
      placeholder="Tax Code"
    />
  </>
)}


      </div>

      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={() => setOpenEdit(false)}
          className="px-4 py-2 rounded border"
        >
          Cancel
        </button>

        <button
          onClick={submitUpdateUser}
          disabled={saving}
          className="px-4 py-2 rounded bg-indigo-600 text-white"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* 🔥 CREATE USER MODAL – GIỮ NGUYÊN */}
      <CreateUserModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={() => {
          setOpenCreate(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
