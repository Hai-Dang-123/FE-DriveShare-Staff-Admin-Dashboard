import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../configs/api";

// =======================
// ROLE OPTIONS
// =======================
const ROLE_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Owner", value: "Owner" },
  { label: "Provider", value: "Provider" },
  { label: "Driver", value: "Driver" },
];

// =======================
// SORT OPTIONS
// =======================
const SORT_OPTIONS = [
  { label: "Default (Full Name A → Z)", field: "fullname", direction: "ASC", value: "fullname_asc" },
  { label: "Full Name Z → A", field: "fullname", direction: "DESC", value: "fullname_desc" },
  { label: "Email A → Z", field: "email", direction: "ASC", value: "email_asc" },
  { label: "Email Z → A", field: "email", direction: "DESC", value: "email_desc" },
  { label: "Created At (Newest first)", field: "createdat", direction: "DESC", value: "createdat_desc" },
  { label: "Created At (Oldest first)", field: "createdat", direction: "ASC", value: "createdat_asc" },
  { label: "Role A → Z", field: "role", direction: "ASC", value: "role_asc" },
  { label: "Role Z → A", field: "role", direction: "DESC", value: "role_desc" },
];

// =======================
// BADGES
// =======================
function RoleBadge({ role }) {
  if (!role) return <span className="text-gray-500 text-xs">N/A</span>;
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (role) {
    case "Owner": return <span className={`${base} bg-emerald-50 text-emerald-700`}>Owner</span>;
    case "Provider": return <span className={`${base} bg-indigo-50 text-indigo-700`}>Provider</span>;
    case "Driver": return <span className={`${base} bg-blue-50 text-blue-700`}>Driver</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-700`}>{role}</span>;
  }
}

function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "ACTIVE": return <span className={`${base} bg-green-50 text-green-700`}>ACTIVE</span>;
    case "INACTIVE": return <span className={`${base} bg-gray-100 text-gray-700`}>INACTIVE</span>;
    case "BANNED": return <span className={`${base} bg-red-50 text-red-700`}>BANNED</span>;
    default: return <span className={`${base} bg-slate-100 text-slate-700`}>{status}</span>;
  }
}

function UserDocumentStatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "PENDING_REVIEW": return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
    case "ACTIVE": return <span className={`${base} bg-green-100 text-green-700`}>Active</span>;
    case "REJECTED": return <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>;
    case "INACTIVE": return <span className={`${base} bg-gray-200 text-gray-700`}>Inactive</span>;
    case "NONE":
    default: return <span className={`${base} bg-gray-100 text-gray-500`}>No docs</span>;
  }
}

function DocumentStatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "PENDING_REVIEW": return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
    case "ACTIVE": return <span className={`${base} bg-green-100 text-green-700`}>Active</span>;
    case "REJECTED": return <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>;
    case "INACTIVE": return <span className={`${base} bg-gray-200 text-gray-700`}>Inactive</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-500`}>No docs</span>;
  }
}

function AvatarCell({ avatarUrl, fullName }) {
  const initials = fullName?.split(" ").map((p) => p[0]).join("")?.toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover border border-gray-200" />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
}

function getRoleName(u) {
  if (!u) return "";
  if (u.roleName) return u.roleName;
  if (typeof u.role === "string") return u.role;
  if (u.role && typeof u.role === "object") return u.role.roleName || u.role.name || "";
  return "";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function UserPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState("fullname");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [sortSelectValue, setSortSelectValue] = useState("fullname_asc");

  const [pageNumber] = useState(1);
  const [pageSize] = useState(500);
  const [totalCount, setTotalCount] = useState(0);

  const [userDocuments, setUserDocuments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);


  
  const pendingRef = useRef(null);

  // ==========================
// ADMIN UPDATE / DELETE USER
// ==========================
const [editOpen, setEditOpen] = useState(false);
const [editForm, setEditForm] = useState({});
const [saving, setSaving] = useState(false);

const [avatarUploading, setAvatarUploading] = useState(false);


const openEditUser = (user) => {
  if (!user) return;
  setEditForm({
    fullName: user.fullName || "",
    avatarUrl: user.avatarUrl || "",
    dateOfBirth: user.dateOfBirth || "",
    address: user.address || null,
    companyName: "",
    taxCode: "",
    licenseNumber: "",
    licenseClass: "",
    licenseExpiryDate: "",
    businessAddress: null,
  });
  setEditOpen(true);
};

const submitUpdateUser = async () => {
  if (!selectedUser) return;
  try {
    setSaving(true);
    const res = await api.put(`/User/${selectedUser.userId}`, editForm);
    if (!res.data?.isSuccess) {
      alert(res.data?.message || "Update failed");
      return;
    }
    setEditOpen(false);
    setSelectedUser(null);
    await fetchUsers();
  } catch {
    alert("Error updating user");
  } finally {
    setSaving(false);
  }
};

const uploadAvatar = async (file) => {
  if (!file) return;

  try {
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "avatar_upload");
    formData.append("folder", "avatars");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");

    setEditForm((prev) => ({
      ...prev,
      avatarUrl: data.secure_url,
    }));
  } catch {
    alert("Upload avatar failed");
  } finally {
    setAvatarUploading(false);
  }
};


const deleteUser = async () => {
  if (!selectedUser) return;
  if (!window.confirm("Bạn chắc chắn muốn xóa user này?")) return;

  try {
    const res = await api.delete(`/User/${selectedUser.userId}`);
    if (!res.data?.isSuccess) {
      alert(res.data?.message || "Delete failed");
      return;
    }
    setSelectedUser(null);
    setUserDocuments([]);
    await fetchUsers();
  } catch {
    alert("Error deleting user");
  }
};


  // ==========================
  // FETCH FULL DOCUMENTS (CHỈ GỌI KHI CLICK USER)
  // ==========================
  const fetchUserDocuments = async (userId, scroll = true) => {
    if (!userId) {
      setUserDocuments([]);
      return;
    }

    try {
      const res = await api.get(`/UserDocument/user/${userId}`);
      if (!res.data?.isSuccess) {
        setUserDocuments([]);
        // update badge docs cho đúng flow (không ảnh hưởng UI)
        setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, documentStatus: "NONE" } : u)));
        return;
      }

      const docs = res.data.result?.documents || [];
      docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setUserDocuments(docs);

      // Update docs status cho đúng user đang chọn (không gọi thêm API)
      let docStatus = "NONE";
      if (docs.length) {
        const pending = docs.find((d) => d.status === "PENDING_REVIEW");
        if (pending) docStatus = "PENDING_REVIEW";
        else docStatus = docs[0].status || "NONE";
      }
      setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, documentStatus: docStatus } : u)));

      if (scroll) {
        const firstPending = docs.find((d) => d.status === "PENDING_REVIEW");
        if (firstPending) {
          setTimeout(() => pendingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
      }
    } catch (err) {
      setUserDocuments([]);
      setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, documentStatus: "NONE" } : u)));
    }
  };

  // ==========================
  // DEBOUNCE SEARCH
  // ==========================
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ==========================
  // FETCH USERS (CHỈ GỌI /User)
  // ==========================
  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        pageNumber,
        pageSize,
      });

      if (search) params.append("search", search);
      if (sortField) params.append("sortField", sortField);
      if (sortDirection) params.append("sortDirection", sortDirection);

      const res = await api.get(`/User?${params.toString()}`);
      if (!res.data?.isSuccess) {
        setError("Cannot load users");
        setLoading(false);
        return;
      }

      const list = res.data.result?.data || [];

      const normalized = list.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        phoneNumber: u.phoneNumber,
        avatarUrl: u.avatarUrl,
        status: u.status,
       roleName: typeof u.role === "string"
  ? u.role
  : u.roleName || u.role?.roleName,

        createdAt: u.createdAt,
        dateOfBirth: u.dateOfBirth,
        isEmailVerified: u.isEmailVerified,
        isPhoneVerified: u.isPhoneVerified,
        address: u.address,
        documentStatus: u.documentStatus || "NONE",
  hasPendingDocumentRequest: u.hasPendingDocumentRequest === true,
      }));

      setUsers(normalized);
      setTotalCount(res.data.result?.totalCount || normalized.length);
    } catch (err) {
      console.error(err);
      setError("Error while fetching users.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, search, sortField, sortDirection]);

  // ==========================
  // FILTERED USERS cho bảng
  // ==========================
  const filteredUsers = users
    .filter((u) => !["Admin", "Staff"].includes(getRoleName(u)))
    .filter((u) => !roleFilter || getRoleName(u).toLowerCase() === roleFilter.toLowerCase());

  // ==========================
  // AUTO SYNC SELECTED USER (✅ FIX FLOW: KHÔNG auto gọi detail)
  // ==========================
  useEffect(() => {
    const visible = users
      .filter((u) => !["Admin", "Staff"].includes(getRoleName(u)))
      .filter((u) => !roleFilter || getRoleName(u).toLowerCase() === roleFilter.toLowerCase());

    if (!visible.length) {
      setSelectedUser(null);
      setUserDocuments([]);
      return;
    }

    // Nếu selectedUser hiện tại không còn trong list (do filter) thì clear
    if (selectedUser && !visible.some((u) => u.userId === selectedUser.userId)) {
      setSelectedUser(null);
      setUserDocuments([]);
    }
  }, [users, roleFilter]);

  // ==========================
  // UI HELPERS
  // ==========================
  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  const handleHeaderSort = (field) => {
    const n = field.toLowerCase();
    if (sortField === n) {
      const nd = sortDirection === "ASC" ? "DESC" : "ASC";
      setSortDirection(nd);
      setSortSelectValue(`${n}_${nd.toLowerCase()}`);
    } else {
      setSortField(n);
      setSortDirection("ASC");
      setSortSelectValue(`${n}_asc`);
    }
  };

  const renderSortIcon = (f) => {
    const n = f.toLowerCase();
    return sortField === n ? (
      <span className="text-xs text-gray-500">
        {sortDirection === "ASC" ? "▲" : "▼"}
      </span>
    ) : null;
  };

  const handleSortSelectChange = (value) => {
    setSortSelectValue(value);
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) {
      setSortField(opt.field);
      setSortDirection(opt.direction);
    }
  };

  const firstPendingDocId =
    userDocuments.find((d) => d.status === "PENDING_REVIEW")?.userDocumentId || null;

  // ==========================
  // MAIN UI RETURN – 2 CỘT
  // ==========================
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Admin / User Management
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* GRID 2 CỘT (6 / 6) */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT — USER LIST */}
          <div className="col-span-7">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col h-[700px]">

              {/* TITLE */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                  <p className="text-xs text-gray-500">Accounts & verification status</p>
                </div>
                <span className="text-xs text-gray-500">
                  Total: <span className="font-semibold text-gray-900">{totalCount}</span>
                </span>
              </div>

              {/* FILTERS */}
              <div className="space-y-3 mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="border border-gray-200 rounded-full px-3 py-1.5 text-xs bg-white"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">Search</label>
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Name, email, phone..."
                      className="border border-gray-200 rounded-full px-3 py-1.5 text-xs bg-gray-50 w-56"
                    />
                  </div>
                </div>

                {/* SORT */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Sort by</span>
                    <select
                      value={sortSelectValue}
                      onChange={(e) => handleSortSelectChange(e.target.value)}
                      className="border border-gray-200 rounded-full px-3 py-1.5 text-xs bg-white"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
                  </div>
                </div>
              </div>

              {/* TABLE */}
              <div className="flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white">
                {loading ? (
                  <div className="p-4 text-sm text-gray-500">Loading...</div>
                ) : error ? (
                  <div className="p-4 text-sm text-red-600">{error}</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No users found.</div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="text-xs text-gray-500">
                          <th className="px-4 py-2">User</th>
                          <th className="px-4 py-2">Full Name</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Role</th>
                          <th className="px-4 py-2">Status</th>
                         <th className="px-4 py-2">Docs</th>
                          <th className="px-4 py-2">Created</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => {
                          const isSelected = selectedUser?.userId === u.userId;
                          return (
                            <tr
  key={u.userId}
  className={`cursor-pointer
    ${u.hasPendingDocumentRequest ? "bg-yellow-50 border-l-4 border-yellow-400" : ""}
    ${isSelected ? "bg-indigo-50/70" : "hover:bg-gray-50"}
  `}
  onClick={() => {
    setSelectedUser(u);
    fetchUserDocuments(u.userId, true);
  }}
>

                              <td className="px-4 py-3">
                                <AvatarCell avatarUrl={u.avatarUrl} fullName={u.fullName} />
                              </td>
                              <td className="px-4 py-3 font-medium">{u.fullName}</td>
                              <td className="px-4 py-3">{u.email}</td>
                             <td className="px-4 py-3">
  <RoleBadge role={getRoleName(u)} />
</td>

<td className="px-4 py-3">
  <StatusBadge status={u.status} />
</td>

<td className="px-4 py-3">
  <UserDocumentStatusBadge status={u.documentStatus} />
</td>

<td className="px-4 py-3">
  {formatDate(u.createdAt)}
</td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
          {/* RIGHT — DETAIL PANEL */}
          <div className="col-span-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 h-[600px] flex flex-col">

              {!selectedUser ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Select a user to view details.
                </div>
              ) : (
                <>
                  {/* HEADER */}
                 <div className="flex items-start justify-between mb-5">
  <div className="flex items-start gap-4">
    <AvatarCell avatarUrl={selectedUser.avatarUrl} fullName={selectedUser.fullName} />
    <div>
      <h2 className="text-xl font-semibold">{selectedUser.fullName}</h2>
      <div className="flex gap-2 mt-2">
        <RoleBadge role={getRoleName(selectedUser)} />
        <StatusBadge status={selectedUser.status} />
        <UserDocumentStatusBadge status={selectedUser.documentStatus} />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Email: <span className="font-medium">{selectedUser.email}</span> •
        Phone: <span className="font-medium">{selectedUser.phoneNumber || "N/A"}</span>
      </p>
    </div>
  </div>

  {/* ADMIN ACTIONS */}
  <div className="flex gap-2">
    <button
      onClick={() => openEditUser(selectedUser)}
      className="px-3 py-1.5 rounded-full border text-xs bg-white hover:bg-gray-50"
    >
      ✏️ Edit
    </button>
    <button
      onClick={deleteUser}
      className="px-3 py-1.5 rounded-full border text-xs text-red-600 hover:bg-red-50"
    >
      🗑 Delete
    </button>
  </div>
</div>


                  {/* BODY */}
                  <div className="flex-1 overflow-y-auto space-y-6">

                    {/* BASIC INFO */}
                    <section>
                      <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <InfoRow label="Full name" value={selectedUser.fullName} />
                        <InfoRow label="Email" value={selectedUser.email} />
                        <InfoRow label="Phone" value={selectedUser.phoneNumber} />
                        <InfoRow label="Role" value={getRoleName(selectedUser)} />
                        <InfoRow label="Status" value={selectedUser.status} />
                      </div>

                      {/* ✅ FIX CRASH: address là object */}
                      {selectedUser.address && (
                        <div className="mt-3">
                          <InfoRow
                            label="Address"
                            value={
                              typeof selectedUser.address === "string"
                                ? selectedUser.address
                                : selectedUser.address.address
                            }
                          />
                        </div>
                      )}
                    </section>

                    {/* DOCUMENTS */}
                    <section>
                      <h3 className="text-sm font-semibold mb-3">User Documents</h3>

                      {userDocuments.length === 0 ? (
                        <div className="text-xs text-gray-500">No documents uploaded.</div>
                      ) : (
                        <div className="space-y-4">
                          {userDocuments.map((doc) => {
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
                                      Created: {formatDate(doc.createdAt)}
                                    </div>
                                  </div>
                                  <DocumentStatusBadge status={doc.status} />
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

                                {(doc.status === "PENDING_REVIEW" ||
                                  doc.status === "REJECTED" ||
                                  doc.status === "INACTIVE") && (
                                  <button
                                    onClick={() => navigate(`/staff/document-reviews/${doc.userDocumentId}`)}
                                    className="mt-3 w-full rounded-full bg-indigo-600 text-white py-2 text-sm"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
{/* UPDATE USER MODAL */}
{editOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white w-full max-w-lg rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Update User</h2>

      <div className="space-y-3">
        <input
          value={editForm.fullName}
          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
          placeholder="Full name"
          className="w-full border rounded px-3 py-2 text-sm"
        />

    {/* AVATAR UPLOAD */}
<div className="space-y-2">
  <label className="text-xs font-medium text-gray-600">Avatar</label>

  {editForm.avatarUrl && (
    <img
      src={editForm.avatarUrl}
      alt="Avatar preview"
      className="w-20 h-20 rounded-full object-cover border"
    />
  )}

  

  {avatarUploading && (
    <p className="text-xs text-gray-500">Uploading avatar...</p>
  )}
</div>


        {getRoleName(selectedUser) === "Driver" && (
          <>
            <input
              placeholder="License number"
              className="w-full border rounded px-3 py-2 text-sm"
              onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
            />
            <input
              placeholder="License class"
              className="w-full border rounded px-3 py-2 text-sm"
              onChange={(e) => setEditForm({ ...editForm, licenseClass: e.target.value })}
            />
          </>
        )}

        {(getRoleName(selectedUser) === "Owner" ||
          getRoleName(selectedUser) === "Provider") && (
          <>
            <input
              placeholder="Company name"
              className="w-full border rounded px-3 py-2 text-sm"
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
            />
            <input
              placeholder="Tax code"
              className="w-full border rounded px-3 py-2 text-sm"
              onChange={(e) => setEditForm({ ...editForm, taxCode: e.target.value })}
            />
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setEditOpen(false)}
          className="px-4 py-2 rounded border text-sm"
        >
          Cancel
        </button>
        <button
          onClick={submitUpdateUser}
          disabled={saving}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

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
      </div>
    </div>
  );
}

// =======================
// INFO ROW
// =======================
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value ?? "-"}</span>
    </div>
  );
}
