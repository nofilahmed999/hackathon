import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut, User, Calendar, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function Topbar({ onToggleMobile, onOpenAI }) {
  const { profile, company, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
    } catch (err) {
      toast.error("Logout error: " + err.message);
    }
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="h-14 bg-white border-b border-[#DBE2EF] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-lg text-[#112D4E] border border-[#DBE2EF] hover:bg-[#3F72AF] hover:text-white hover:border-[#3F72AF] active:scale-95 transition-all duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#112D4E]/70">
          <Calendar className="w-3.5 h-3.5 text-[#3F72AF]" />
          <span className="font-medium hidden sm:inline">{todayStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Quick Access */}
        <button
          onClick={onOpenAI}
          className="px-3.5 py-1.5 text-xs font-semibold text-[#3F72AF] bg-[#3F72AF]/10 border border-[#3F72AF]/20 rounded-lg hover:bg-[#3F72AF] hover:text-white transition-all duration-150"
        >
          AI Assistant
        </button>

        {/* Company badge */}
        {company?.name && (
          <div className="hidden lg:flex items-center text-xs px-2.5 py-1.5 bg-[#F9F7F7] border border-[#DBE2EF] rounded-lg text-[#112D4E] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
            {company.name}
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#DBE2EF]">
          <div className="w-8 h-8 rounded-full bg-[#112D4E] text-white flex items-center justify-center font-semibold text-xs">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-semibold text-[#112D4E]">{profile?.name || "User"}</p>
            <p className="text-[10px] text-[#112D4E]/50 capitalize">{profile?.role || "Employee"}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-150"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
