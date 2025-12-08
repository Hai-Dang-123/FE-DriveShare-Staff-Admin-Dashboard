// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./pages/LoginScreen";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import RequireRole from "./components/RequireRole";

import ContractTemplatePage from "./pages/staff/ContractTemplatePage";
import DeliveryRecordTemplatePage from "./pages/staff/DeliveryRecordTemplatePage";
import PostPackagePage from "./pages/staff/PostPackagePage";
import PostTripPage from "./pages/staff/PostTripPage";
import TripPage from "./pages/staff/TripPage";

import ItemPage from "./pages/staff/ItemPage";
import PackagePage from "./pages/staff/PackagePage";
import VehiclePage from "./pages/staff/VehiclePage"; 

import DocumentReviewList from "./pages/staff/DocumentReviewList";
import DocumentReviewDetail from "./pages/staff/DocumentReviewDetail";

import VehicleDocumentReviewList from "./pages/staff/VehicleDocumentReviewList";
import VehicleDocumentReviewDetail from "./pages/staff/VehicleDocumentReviewDetail";


import UserPage from "./pages/staff/UserPage";

export default function App() {
  return (
    <div className="bg-red-500 min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* LOGIN */}
          <Route path="/" element={<LoginScreen />} />

          {/* STAFF DASHBOARD */}
          <Route
            path="/staff"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <StaffDashboard />
              </RequireRole>
            }
          />
          

          {/* STAFF SUB PAGES */}
          <Route
            path="/staff/contract-templates"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <ContractTemplatePage />
              </RequireRole>
            }
          />
          <Route
            path="/staff/delivery-record-templates"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <DeliveryRecordTemplatePage />
              </RequireRole>
            }
          />
          <Route
            path="/staff/items"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <ItemPage />
              </RequireRole>
            }
          />
          <Route
            path="/staff/packages"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <PackagePage />
              </RequireRole>
            }
          />
          <Route
  path="/staff/post-packages"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <PostPackagePage />
    </RequireRole>
  }
/>
<Route
  path="/staff/post-trips"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <PostTripPage />
    </RequireRole>
  }
/>
<Route
  path="/staff/trips"
  element={
    <RequireRole allowedRoles={["staff"]}>
      <TripPage />
    </RequireRole>
  }
/>

          {/* 🔥 NEW: VEHICLES */}
          <Route
            path="/staff/vehicles"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <VehiclePage />
              </RequireRole>
            }
          />
          <Route
            path="/staff/users"
            element={
              <RequireRole allowedRoles={["Staff"]}>
                <UserPage />
              </RequireRole>
            }
          />

          <Route
  path="/staff/document-reviews"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <DocumentReviewList />
    </RequireRole>
  }
/>

<Route
  path="/staff/vehicle-document-reviews"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <VehicleDocumentReviewList />
    </RequireRole>
  }
/>

<Route
  path="/staff/vehicle-document-reviews/:id"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <VehicleDocumentReviewDetail />
    </RequireRole>
  }
/>

<Route
  path="/staff/document-reviews/:id"
  element={
    <RequireRole allowedRoles={["Staff"]}>
      <DocumentReviewDetail />
    </RequireRole>
  }
/>

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <RequireRole allowedRoles={["Admin"]}>
                <AdminDashboard />
              </RequireRole>
            }
          />

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
