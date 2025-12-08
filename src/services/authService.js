import api from '../configs/api';

// Giải mã JWT
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Lấy role từ payload
function extractRoleFromPayload(payload) {
  if (!payload) return null;

  return (
    payload.role ||
    payload.Role ||
    payload.roles ||
    payload.Roles ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    null
  );
}

const authService = {
  login: async (email, password) => {
    try {
      // ❗ FIX 1: Bỏ dấu `/` thừa phía trước endpoint → phải gọi "Auth/login"
      const res = await api.post('Auth/login', { email, password }); // FIX

      const payload = res?.data;
      if (!payload) {
        return { message: 'Empty response', success: false };
      }

      // ❗ FIX 2: Lấy token đúng từ cấu trúc thật của backend
      const data = payload.result; // FIX – backend bạn trả {result: {accessToken, refreshToken}}
      const access = data?.accessToken || null; // FIX
      const refresh = data?.refreshToken || null; // FIX

      if (access) {
        localStorage.setItem('accessToken', access); // FIX – không dùng JSON.stringify nữa
      }
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
      }

      // ❗ FIX 3: Decode role từ token
      const decoded = parseJwt(access);
      const role = extractRoleFromPayload(decoded) || null;

      return {
        isSuccess: payload.isSuccess,
        message: payload.message,
        statusCode: payload.statusCode,
        role,
      };
    } catch (err) {
      // ❗ FIX 4: Chuẩn hoá error return
      return {
        message: err?.response?.data?.message || 'Login failed',
        statusCode: err?.response?.status || 500,
        isSuccess: false,
      };
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getRoleFromStoredToken: () => {
    try {
      // ❗ FIX 5: Token trong localStorage lưu dạng chuỗi, không cần JSON.parse
      const token = localStorage.getItem('accessToken'); // FIX
      const decoded = parseJwt(token);
      return extractRoleFromPayload(decoded);
    } catch {
      return null;
    }
  }
};

export default authService;
