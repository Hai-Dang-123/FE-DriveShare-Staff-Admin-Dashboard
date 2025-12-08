import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Auth service
import authService from '../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    setLoading(true);
    setMessage(null);

    console.log('Đăng nhập với:', email, password);

    try {
      const res = await authService.login(email, password);
      setLoading(false);

      const ok =
        res && (res.isSuccess === true || res.success === true || (typeof res.statusCode === 'number' ? (res.statusCode >= 200 && res.statusCode < 300) : false));

      if (ok) {
        const role = res.role || authService.getRoleFromStoredToken();
        if (role && role.toString().toLowerCase().includes('admin')) {
          navigate('/admin');
          return;
        } else if (role && role.toString().toLowerCase().includes('staff')) {
          navigate('/staff');
          return;
        } else {
          authService.logout();
          setMessage({ type: 'error', text: 'Unauthorized role. Access denied.' });
          return;
        }
      } else {
        setMessage({ type: 'error', text: res.message || 'Login failed' });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: err?.message || 'Login error' });
    }

    // // Logic cũ của bạn (cần file authService)
    // const res = await authService.login(email, password);
    // setLoading(false);
    // const ok = res && (res.isSuccess === true || res.success === true || res.statusCode === 200 || res.statusCode === 201 || (res.statusCode >= 200 && res.statusCode < 300));
    // if (ok) {
    //   const role = res.role || authService.getRoleFromStoredToken();
    //   if (role && role.toString().toLowerCase().includes('admin')) {
    //     navigate('/admin');
    //   } else if (role && role.toString().toLowerCase().includes('staff')) {
    //     navigate('/staff');
    //   } else {
    //     authService.logout();
    //     setMessage({ type: 'error', text: 'Unauthorized role. Access denied.' });
    //   }
    // } else {
    //   setMessage({ type: 'error', text: res.message || 'Login failed' });
    // }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Cột Trái - Branding */}
        <div
          className="hidden lg:flex w-1/2 bg-indigo-800 items-center justify-center p-12 relative overflow-hidden"
          style={{ position: 'relative' }}
        >
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-bold mb-3">DriveShare</h1>
          <p className="text-indigo-200 text-xl">
            Connecting Providers, Owners & Drivers.
            <br />
            Efficiency in Every Mile.
          </p>
        </div>
        {/* overlay hình nền (không chặn tương tác) */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/subtle-road.png')] z-0 pointer-events-none"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        ></div>
      </div>

      {/* Cột Phải - Form Đăng Nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            Sign in
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome to the Staff & Admin portal.
          </p>

          {message && (
            <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.912l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.905A2.25 2.25 0 012.25 6.993v-.243" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-colors duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}