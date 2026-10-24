import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function RoleGuard({ allowedRoles, children }) {
  const { profile } = useAuth();
  const userRole = profile?.role || "employee";

  // Admins possess super-user authority across the entire platform
  if (userRole === "admin" || allowedRoles.includes(userRole)) {
    return children;
  }

  const fallbackPath = 
    userRole === "admin" 
      ? "/admin/dashboard" 
      : userRole === "hr" 
      ? "/hr/dashboard" 
      : "/employee/dashboard";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#112D4E]">Access Restricted</h2>
      <p className="text-sm text-[#112D4E]/70 max-w-md mt-2">
        Your current account role (<span className="font-semibold capitalize text-[#3F72AF]">{userRole}</span>) does not have authorization to view this section.
      </p>
      <Link
        to={fallbackPath}
        className="mt-6 px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] transition-colors"
      >
        Return to Your Dashboard
      </Link>
    </div>
  );
}
