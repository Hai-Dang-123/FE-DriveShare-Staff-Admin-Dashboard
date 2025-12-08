// src/pages/admin/UserPage.jsx
import React, { useEffect, useState } from "react";
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
// BADGE COMPONENTS
// =======================
function RoleBadge({ role }) {
  if (!role) return <span className="text-gray-500 text-xs">N/A</span>;
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (role) {
    case "Owner":
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>Owner</span>;
    case "Provider":
      return <span className={`${base} bg-indigo-50 text-indigo-700`}>Provider</span>;
    case "Driver":
      return <span className={`${base} bg-blue-50 text-blue-700`}>Driver</span>;
    default:
      return <span className={`${base} bg-gray-100 text-gray-700`}>{role}</span>;
  }
}

function StatusBadge({ status }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  switch (status) {
    case "ACTIVE":
      return <span className={`${base} bg-green-50 text-green-700`}>ACTIVE</span>;
    case "INACTIVE":
      return <span className={`${base} bg-gray-100 text-gray-700`}>INACTIVE</span>;
    case "BANNED":
      return <span className={`${base} bg-red-50 text-red-700`}>BANNED</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-700`}>{status}</span>;
  }
}

function AvatarCell({ avatarUrl, fullName }) {
  const initials = fullName?.split(" ").map((p) => p[0]).join("").toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="h-9 w-9 rounded-full object-cover border border-gray-200"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
}

// =======================
// SAFELY GET ROLE
// =======================
function getRoleName(u) {
  if (!u) return "";
  if (u.roleName) return u.roleName;
  if (typeof u.role === "string") return u.role;
  if (u.role && typeof u.role === "object") {
    return u.role.roleName || u.role.name || "";
  }
  return "";
}

// =======================
// MAIN PAGE
// =======================
export default function UserPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Sort
  const [sortField, setSortField] = useState("fullname");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [sortSelectValue, setSortSelectValue] = useState("fullname_asc");

  // Paging
  const [pageNumber] = useState(1);
  const [pageSize] = useState(500);
  const [totalCount, setTotalCount] = useState(0);

  // User Documents
  const [userDocuments, setUserDocuments] = useState([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  // ==========================
  // FETCH DOCUMENTS
  // ==========================
  const fetchUserDocuments = async (userId) => {
    if (!userId) {
      console.error("❌ Cannot load documents: userId is undefined");
      return;
    }

    try {
      const res = await api.get(`/UserDocument/user/${userId}`);

      if (res.data?.isSuccess) {
        const docs = res.data.result?.documents || [];
        setUserDocuments(docs);
        setDocumentModalOpen(true);
      } else {
        alert("Cannot load user documents");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching documents");
    }
  };

  // ==========================
  // DEBOUNCE SEARCH
  // ==========================
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ==========================
  // FETCH USERS (FIXED)
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

      if (res.data?.isSuccess) {
        const result = res.data.result || {};

        // BE returns result.data = list
        const list = result.data || [];

        // FIX userId undefined
        const normalized = list.map((u) => ({
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          avatarUrl: u.avatarUrl,
          status: u.status,
          roleName: u.roleName || (u.role && u.role.roleName),
          createdAt: u.createdAt,
          dateOfBirth: u.dateOfBirth,
          isEmailVerified: u.isEmailVerified,
          isPhoneVerified: u.isPhoneVerified,
          address: u.address,
        }));

        setUsers(normalized);
        setTotalCount(result.totalCount || normalized.length);
      } else {
        setError(res.data?.message || "Cannot load users");
      }
    } catch (err) {
      console.error(err);
      setError("Error while fetching users.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, search, sortField, sortDirection]);

  // FILTER ROLES
  const filteredUsers = users
    .filter((u) => !["Admin", "Staff"].includes(getRoleName(u)))
    .filter((u) => !roleFilter || getRoleName(u).toLowerCase() === roleFilter.toLowerCase());

  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  // ==========================
  // SORT HANDLERS
  // ==========================
  const handleHeaderSort = (field) => {
    const normalized = field.toLowerCase();

    if (sortField === normalized) {
      const newDir = sortDirection === "ASC" ? "DESC" : "ASC";
      setSortDirection(newDir);
      setSortSelectValue(`${normalized}_${newDir.toLowerCase()}`);
    } else {
      setSortField(normalized);
      setSortDirection("ASC");
      setSortSelectValue(`${normalized}_asc`);
    }
  };

  const renderSortIcon = (field) => {
    const norm = field.toLowerCase();
    return sortField === norm ? (
      <span className="text-xs text-gray-500">{sortDirection === "ASC" ? "▲" : "▼"}</span>
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

  // ==========================
  // RETURN UI
  // ==========================
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Admin / User Management</p>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>

          <button
            onClick={() => navigate("/staff")}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FILTER + SEARCH + SORT */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            {/* Filter role */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, phone..."
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white w-56"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by</label>
              <select
                value={sortSelectValue}
                onChange={(e) => handleSortSelectChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{totalCount}</span> users
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>

          {loading && <p className="text-gray-600 text-sm">Loading...</p>}
          {error && !loading && <p className="text-sm text-red-600 mb-3">⚠ {error}</p>}

          {!loading && !error && filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500">No users found.</p>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Avatar</th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("fullname")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Full Name {renderSortIcon("fullname")}
                      </span>
                    </th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("email")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Email {renderSortIcon("email")}
                      </span>
                    </th>

                    <th className="px-4 py-3 text-left">Phone</th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("role")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Role {renderSortIcon("role")}
                      </span>
                    </th>

                    <th className="px-4 py-3 text-left">Status</th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleHeaderSort("createdat")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Created At {renderSortIcon("createdat")}
                      </span>
                    </th>

                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => {
                    const roleName = getRoleName(u);

                    return (
                      <tr key={u.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <AvatarCell avatarUrl={u.avatarUrl} fullName={u.fullName} />
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3 text-gray-700">{u.phoneNumber}</td>

                        <td className="px-4 py-3">
                          <RoleBadge role={roleName} />
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={u.status} />
                        </td>

                        <td className="px-4 py-3 text-gray-700">{formatDate(u.createdAt)}</td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3 text-right flex gap-3 justify-end">

                          {/* VIEW USER */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View
                          </button>

                          {/* VIEW DOCUMENTS */}
                          <button
                            onClick={() => fetchUserDocuments(u.userId)}
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                          >
                            Documents
                          </button>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DOCUMENT MODAL */}
        {documentModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-xl rounded-xl shadow-xl p-6 relative">

              <button
                onClick={() => setDocumentModalOpen(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Documents</h2>

              {userDocuments.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {userDocuments.map((doc) => (
                    <div key={doc.userDocumentId} className="border rounded-lg p-4 bg-gray-50">

                      <p className="font-semibold">{doc.documentType}</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-medium">{doc.status}</span>
                      </p>

                      <div className="mt-3">
                        <img
                          src={doc.frontImageUrl}
                          alt="Front"
                          className="w-full rounded-lg border mb-2"
                        />
                        {doc.backImageUrl && (
                          <img
                            src={doc.backImageUrl}
                            alt="Back"
                            className="w-full rounded-lg border"
                          />
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USER DETAIL MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">

              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 mb-4">
                <AvatarCell avatarUrl={selectedUser.avatarUrl} fullName={selectedUser.fullName} />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedUser.fullName}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <RoleBadge role={getRoleName(selectedUser)} />
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                <div><span className="font-medium">Phone:</span> {selectedUser.phoneNumber}</div>

                <div>
                  <span className="font-medium">Date of birth:</span>{" "}
                  {selectedUser.dateOfBirth
                    ? new Date(selectedUser.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </div>

                <div className="flex gap-4">
                  <span className="text-xs text-gray-500">
                    Email verified: <span className="font-semibold">{selectedUser.isEmailVerified ? "Yes" : "No"}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Phone verified: <span className="font-semibold">{selectedUser.isPhoneVerified ? "Yes" : "No"}</span>
                  </span>
                </div>

                <div><span className="font-medium">Created at:</span> {formatDate(selectedUser.createdAt)}</div>

                {selectedUser.address && (
                  <div>
                    <span className="font-medium">Address:</span> {selectedUser.address}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
