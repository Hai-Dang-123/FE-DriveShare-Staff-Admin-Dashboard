import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ICON WRAPPER
const IconBox = ({ children, color = "text-indigo-500" }) => (
  <div className={`w-9 h-9 ${color} flex items-center justify-center`}>
    {children}
  </div>
);

// SIDEBAR ITEM
const SidebarItem = ({ label, to, icon, active }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
        ${active ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-200"}
      `}
    >
      {icon}
      {label}
    </button>
  );
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // ========================
  // MENU CHUẨN — KHÔNG CÓ Contract Terms
  // ========================
  const menu = [
    {
      label: "Dashboard",
      to: "/staff",
      icon: (
        <IconBox>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M3 12l2-2m0 0l7-7 7 7m-9-7v18"
            />
          </svg>
        </IconBox>
      ),
    },

    {
      label: "Contract Templates",
      to: "/staff/contract-templates",
      icon: (
        <IconBox color="text-green-500">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </IconBox>
      ),
    },

    {
      label: "Items",
      to: "/staff/items",
      icon: (
        <IconBox color="text-blue-500">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </IconBox>
      ),
    },

    {
      label: "Packages",
      to: "/staff/packages",
      icon: (
        <IconBox color="text-purple-500">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7l9-4 9 4-9 4-9-4zm0 6l9 4 9-4"
            />
          </svg>
        </IconBox>
      ),
    },

    {
      label: "Post Packages",
      to: "/staff/post-packages",
      icon: (
        <IconBox color="text-yellow-500">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17a4 4 0 11-7 0 4 4 0 017 0zm13 0a4 4 0 11-7 0 4 4 0 017 0z"
            />
          </svg>
        </IconBox>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg p-5 space-y-2">

        <h2 className="text-xl font-bold text-gray-800 mb-4">Staff Menu</h2>

        {menu.map((item, idx) => (
          <SidebarItem
            key={idx}
            {...item}
            active={location.pathname === item.to}
          />
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Staff Dashboard</h1>

        <p className="text-gray-600 mb-10">
          Welcome, staff user. Manage your workflow efficiently.
        </p>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CARD 1 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <IconBox color="text-yellow-500">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0"
                  />
                </svg>
              </IconBox>
            </div>

            <div className="text-gray-500 text-sm uppercase">Pending Shipments</div>
            <div className="text-3xl font-bold">12</div>
          </div>

          {/* CARD 2 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <IconBox color="text-green-600">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l18 0" />
                </svg>
              </IconBox>
            </div>

            <div className="text-gray-500 text-sm uppercase">Active Shipments</div>
            <div className="text-3xl font-bold">84</div>
          </div>

          {/* CARD 3 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <IconBox color="text-blue-500">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6a3 3 0 110 6 3 3 0 010-6z"
                  />
                </svg>
              </IconBox>
            </div>

            <div className="text-gray-500 text-sm uppercase">Drivers Online</div>
            <div className="text-3xl font-bold">250</div>
          </div>

          {/* CARD 4 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <IconBox color="text-red-500">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
                </svg>
              </IconBox>
            </div>

            <div className="text-gray-500 text-sm uppercase">Support Tickets</div>
            <div className="text-3xl font-bold">3</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-12 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Awaiting Approval</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Shipment ID</th>
                  <th className="px-6 py-3 text-left">Provider</th>
                  <th className="px-6 py-3 text-left">Driver</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">#DS-1024</td>
                  <td className="px-6 py-4 text-gray-600">LogiCorp</td>
                  <td className="px-6 py-4 text-gray-600">John Doe</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Review
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
}
