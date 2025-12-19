import React, { useEffect, useState } from "react";
import api from "../../configs/api";

export default function CreateUserModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    roleName: "",
    dateOfBirth: "",
    address: "",
  });

  /* =======================
     FETCH ROLES (ADMIN)
  ======================= */
  useEffect(() => {
    if (!open) return;

    const fetchRoles = async () => {
      try {
        const res = await api.get("/Admin/roles");
        if (res.data?.isSuccess) {
          // ❌ loại Admin
          setRoles(res.data.result.filter(r => r.roleName !== "Admin"));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoles();
  }, [open]);

  if (!open) return null;

  /* =======================
     HANDLE CHANGE
  ======================= */
  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =======================
     CALCULATE AGE (CHUẨN)
  ======================= */
  const calculateAge = (dob) => {
    if (!dob) return 0;

    const today = new Date();
    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  /* =======================
     VALIDATION
  ======================= */
  const validate = () => {
    if (!form.fullName || !form.email || !form.phoneNumber)
      return "Thiếu thông tin cơ bản";

    if (!form.roleName)
      return "Chưa chọn role";

    if (!form.password || !form.confirmPassword)
      return "Thiếu mật khẩu";

    if (form.password !== form.confirmPassword)
      return "Mật khẩu xác nhận không khớp";

    const needDobRoles = ["Driver", "Owner", "Provider"];

    if (needDobRoles.includes(form.roleName)) {
      if (!form.dateOfBirth)
        return "Thiếu ngày sinh";

      const age = calculateAge(form.dateOfBirth);
      if (age < 18)
        return "Người dùng phải đủ 18 tuổi để được tạo tài khoản";
    }

    return "";
  };

  /* =======================
     SUBMIT — CHUẨN BE
  ======================= */
  const handleSubmit = async () => {
    setError("");

    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("FullName", form.fullName);
      formData.append("Email", form.email);
      formData.append("PhoneNumber", form.phoneNumber);
      formData.append("Password", form.password);
      formData.append("ConfirmPassword", form.confirmPassword);
      formData.append("RoleName", form.roleName);

      // ✅ DOB: đã validate đủ tuổi ở trên
      formData.append(
        "DateOfBirth",
        form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : new Date("2000-01-01").toISOString()
      );

      // ✅ DTO yêu cầu
      formData.append("Address", form.address || "N/A");

      const res = await api.post(
        "/Auth/register-for-admin",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (!res.data?.isSuccess) {
        setError(res.data?.message || "Tạo tài khoản thất bại");
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Create user error:", err);
      setError("Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[520px] p-6">

        <h2 className="text-xl font-semibold mb-4">Create New User</h2>

        <div className="space-y-3">
          <input
            name="fullName"
            placeholder="Full name"
            value={form.fullName}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="phoneNumber"
            placeholder="Phone number"
            value={form.phoneNumber}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <select
            name="roleName"
            value={form.roleName}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select role</option>
            {roles.map(r => (
              <option key={r.roleId} value={r.roleName}>
                {r.roleName}
              </option>
            ))}
          </select>

          {["Driver", "Owner", "Provider"].includes(form.roleName) && (
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
