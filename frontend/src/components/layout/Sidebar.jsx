import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  FolderTree,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  ClipboardList,
  ScanFace,
  X,
} from "lucide-react";

export default function Sidebar({ mobileOpen, onCloseMobile, onOpenAI }) {
  const { profile, company } = useAuth();
  const role = profile?.role || "employee";

  const adminNav = [
    { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Company Settings", to: "/admin/company", icon: Building2 },
    { name: "HR Management", to: "/admin/hr", icon: UserCheck },
    { name: "Employees", to: "/admin/employees", icon: Users },
    { name: "Departments", to: "/admin/departments", icon: FolderTree },
    { name: "Attendance Records", to: "/admin/attendance", icon: CalendarCheck },
    { name: "Face Attendance", to: "/employee/attendance", icon: ScanFace },
    { name: "Face Enrollment", to: "/employee/enrollment", icon: UserCheck },
    { name: "Leave Management", to: "/admin/leaves", icon: CalendarClock },
    { name: "Activity Logs", to: "/admin/activity", icon: ClipboardList },
  ];

  const hrNav = [
    { name: "Dashboard", to: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Employee Directory", to: "/hr/employees", icon: Users },
    { name: "Departments", to: "/hr/departments", icon: FolderTree },
    { name: "Attendance Board", to: "/hr/attendance", icon: CalendarCheck },
    { name: "Face Attendance", to: "/employee/attendance", icon: ScanFace },
    { name: "Face Enrollment", to: "/employee/enrollment", icon: UserCheck },
    { name: "Leave Approvals", to: "/hr/leaves", icon: CalendarClock },
  ];

  const employeeNav = [
    { name: "My Dashboard", to: "/employee/dashboard", icon: LayoutDashboard },
    { name: "Face Attendance", to: "/employee/attendance", icon: ScanFace },
    { name: "Face Enrollment", to: "/employee/enrollment", icon: UserCheck },
    { name: "My Leaves", to: "/employee/leaves", icon: CalendarClock },
  ];

  const navItems = role === "admin" ? adminNav : role === "hr" ? hrNav : employeeNav;

  const content = (
    <div className="flex flex-col h-full bg-[#112D4E] text-[#F9F7F7]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#3F72AF]/30">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1.5 rounded-lg bg-[#3F72AF] font-bold text-white text-xs tracking-wider">
            HCM
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white leading-tight">
              HCM Lite
            </h1>
            <p className="text-[11px] text-[#DBE2EF]/70 truncate max-w-[140px]">
              {company?.name || "HR System"}
            </p>
          </div>
        </div>
        {/* Mobile Close */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-[#DBE2EF]/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role Badge */}
      <div className="px-5 py-2.5 bg-[#112D4E]/80 border-b border-[#3F72AF]/20 flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#DBE2EF]/50">
          Role
        </span>
        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-[#3F72AF]/30 text-[#DBE2EF] border border-[#3F72AF]/40">
          {role}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#3F72AF] text-white font-semibold"
                    : "text-[#DBE2EF]/75 hover:bg-[#3F72AF]/15 hover:text-white"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* AI Assistant - Opens panel instead of navigating */}
        <button
          onClick={onOpenAI}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#DBE2EF]/75 hover:bg-[#3F72AF]/15 hover:text-white transition-all duration-150"
        >
          <Sparkles className="w-[18px] h-[18px] shrink-0" />
          <span>AI HR Assistant</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#3F72AF]/30 text-[10px] text-[#DBE2EF]/50">
        Saylani Hackathon — HCM Lite
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer with transition */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCloseMobile} />
        <div
          className={`fixed top-0 left-0 h-full w-64 max-w-[80vw] z-50 transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </div>
      </div>
    </>
  );
}
