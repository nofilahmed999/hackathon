import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Layout & Pages
import LoginPage from "./pages/auth/LoginPage";
import BootstrapPage from "./pages/auth/BootstrapPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import CompanySetupPage from "./pages/admin/CompanySetupPage";

// Layout & Guards
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompanySettingsPage from "./pages/admin/CompanySettingsPage";
import HRManagementPage from "./pages/admin/HRManagementPage";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";

// HR Pages
import HRDashboard from "./pages/hr/HRDashboard";

// Shared Pages
import EmployeeDirectoryPage from "./pages/common/EmployeeDirectoryPage";
import DepartmentManagementPage from "./pages/common/DepartmentManagementPage";
import AttendanceRecordsPage from "./pages/common/AttendanceRecordsPage";
import LeaveManagementPage from "./pages/common/LeaveManagementPage";
import AIAssistantPage from "./pages/common/AIAssistantPage";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import FaceAttendancePage from "./pages/employee/FaceAttendancePage";
import FaceEnrollmentPage from "./pages/employee/FaceEnrollmentPage";
import EmployeeLeavesPage from "./pages/employee/EmployeeLeavesPage";

function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7]">
        <div className="w-8 h-8 border-3 border-[#DBE2EF] border-t-[#3F72AF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role === "admin") {
    return !profile.companyId ? (
      <Navigate to="/admin/company-setup" replace />
    ) : (
      <Navigate to="/admin/dashboard" replace />
    );
  } else if (profile?.role === "hr") {
    return <Navigate to="/hr/dashboard" replace />;
  } else {
    return <Navigate to="/employee/dashboard" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bootstrap" element={<BootstrapPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Admin Company Setup (Before company is created) */}
        <Route
          path="/admin/company-setup"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["admin"]}>
                <CompanySetupPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Authenticated Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/company"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <CompanySettingsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/hr"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <HRManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <EmployeeDirectoryPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <DepartmentManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <AttendanceRecordsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <LeaveManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <ActivityLogsPage />
              </RoleGuard>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr/dashboard"
            element={
              <RoleGuard allowedRoles={["admin", "hr"]}>
                <HRDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/hr/employees"
            element={
              <RoleGuard allowedRoles={["admin", "hr"]}>
                <EmployeeDirectoryPage />
              </RoleGuard>
            }
          />
          <Route
            path="/hr/departments"
            element={
              <RoleGuard allowedRoles={["admin", "hr"]}>
                <DepartmentManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/hr/attendance"
            element={
              <RoleGuard allowedRoles={["admin", "hr"]}>
                <AttendanceRecordsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/hr/leaves"
            element={
              <RoleGuard allowedRoles={["admin", "hr"]}>
                <LeaveManagementPage />
              </RoleGuard>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <RoleGuard allowedRoles={["admin", "hr", "employee"]}>
                <EmployeeDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <RoleGuard allowedRoles={["admin", "hr", "employee"]}>
                <FaceAttendancePage />
              </RoleGuard>
            }
          />
          <Route
            path="/employee/enrollment"
            element={
              <RoleGuard allowedRoles={["admin", "hr", "employee"]}>
                <FaceEnrollmentPage />
              </RoleGuard>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <RoleGuard allowedRoles={["admin", "hr", "employee"]}>
                <EmployeeLeavesPage />
              </RoleGuard>
            }
          />

          {/* Shared AI Assistant Route */}
          <Route
            path="/ai-assistant"
            element={
              <RoleGuard allowedRoles={["admin", "hr", "employee"]}>
                <AIAssistantPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
