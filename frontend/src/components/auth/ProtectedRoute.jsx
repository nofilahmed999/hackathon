import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7]">
        <LoadingSpinner message="Verifying session and permissions..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is Admin but hasn't completed Company Setup yet, redirect to company setup
  if (profile?.role === "admin" && !profile?.companyId && location.pathname !== "/admin/company-setup") {
    return <Navigate to="/admin/company-setup" replace />;
  }

  return children;
}
