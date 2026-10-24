import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCompanyMetrics, getTodayDateKey } from "../../services/firestoreService";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import {
  Users,
  UserCheck,
  FolderTree,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const { company } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!company?.id) return;
      try {
        setLoading(true);
        const data = await getCompanyMetrics(company.id);
        setMetrics(data);
      } catch (err) {
        console.error("Dashboard metrics error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [company?.id]);

  if (loading) {
    return <LoadingSpinner message="Calculating organization metrics from Cloud Firestore..." />;
  }

  const employees = metrics?.employees || [];
  const activeEmployees = employees.filter((e) => e.status === "active");
  const hrUsers = metrics?.hrUsers || [];
  const departments = metrics?.departments || [];
  const todayAttendance = metrics?.todayAttendance || [];
  const leaveRequests = metrics?.leaveRequests || [];
  const activities = metrics?.activities || [];

  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const lateCount = todayAttendance.filter((a) => a.status === "late").length;
  const halfDayCount = todayAttendance.filter((a) => a.status === "half-day").length;
  const missingCount = Math.max(0, activeEmployees.length - todayAttendance.length);

  // Department distribution for Recharts
  const deptChartData = departments.map((d) => ({
    name: d.name,
    employees: employees.filter((e) => e.departmentId === d.id).length,
  }));

  // Attendance distribution for Recharts
  const attendancePieData = [
    { name: "On-Time (Present)", value: presentCount, color: "#10B981" },
    { name: "Late Arrival", value: lateCount, color: "#F59E0B" },
    { name: "Half-Day", value: halfDayCount, color: "#F97316" },
    { name: "Pending Check-In", value: missingCount, color: "#DBE2EF" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#DBE2EF] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3F72AF]">
            Administrative Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E] mt-0.5">
            {company?.name || "Company Overview"}
          </h1>
          <p className="text-xs text-[#112D4E]/70 mt-1">
            Real-time Firestore aggregated statistics for {getTodayDateKey()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/hr"
            className="px-4 py-2 text-xs font-semibold bg-[#112D4E] text-white rounded-lg hover:bg-[#3F72AF] transition-colors"
          >
            Manage HR
          </Link>
          <Link
            to="/admin/employees"
            className="px-4 py-2 text-xs font-semibold bg-[#3F72AF] text-white rounded-lg hover:bg-[#112D4E] transition-colors"
          >
            Employee Directory
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
              Active Employees
            </span>
            <div className="p-2 bg-[#F9F7F7] border border-[#DBE2EF] rounded text-[#3F72AF]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#112D4E]">{activeEmployees.length}</span>
            <span className="text-xs text-[#112D4E]/60">of {employees.length} total</span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
              Today's Attendance
            </span>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700">{todayAttendance.length}</span>
            <span className="text-xs text-[#112D4E]/60">
              ({activeEmployees.length > 0 ? Math.round((todayAttendance.length / activeEmployees.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
              Departments
            </span>
            <div className="p-2 bg-[#F9F7F7] border border-[#DBE2EF] rounded text-[#112D4E]">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#112D4E]">{departments.length}</span>
            <span className="text-xs text-[#112D4E]/60">configured</span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
              Pending Leaves
            </span>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-700">{pendingLeaves.length}</span>
            <span className="text-xs text-[#112D4E]/60">awaiting review</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown Chart */}
        <Card title="Today's Attendance Status" subtitle="Verification metrics from face check-ins">
          {todayAttendance.length === 0 && activeEmployees.length === 0 ? (
            <EmptyState
              title="No Attendance Data"
              description="Register employees and have them check in to populate live attendance statistics."
              icon={CalendarCheck}
            />
          ) : (
            <div className="h-64 flex flex-col justify-center">
              {attendancePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} employees`, name]}
                      contentStyle={{ backgroundColor: "#112D4E", color: "#F9F7F7", borderRadius: "6px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-xs text-[#112D4E]/60">Awaiting check-ins...</p>
              )}
            </div>
          )}
        </Card>

        {/* Department Distribution Chart */}
        <Card title="Headcount by Department" subtitle="Active employees per functional department">
          {departments.length === 0 ? (
            <EmptyState
              title="No Departments Created"
              description="Create your company departments to view structural headcount distribution."
              icon={FolderTree}
              actionText="Add Department"
              onAction={() => window.location.href = "/admin/departments"}
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#112D4E" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#112D4E" }} />
                  <Tooltip
                    cursor={{ fill: "#F9F7F7" }}
                    contentStyle={{ backgroundColor: "#112D4E", color: "#F9F7F7", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Bar dataKey="employees" fill="#3F72AF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity and Audit Trail */}
      <Card title="Recent Activity & Audit Trail" subtitle="System events recorded in Cloud Firestore">
        {activities.length === 0 ? (
          <p className="text-center py-6 text-xs text-[#112D4E]/60">No activity logged yet.</p>
        ) : (
          <div className="divide-y divide-[#DBE2EF]">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded bg-[#F9F7F7] border border-[#DBE2EF] flex items-center justify-center text-[#3F72AF]">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#112D4E]">{act.action}</p>
                    <p className="text-[11px] text-[#112D4E]/60">
                      by <span className="font-medium">{act.actorName}</span> on {act.target}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[#112D4E]/50">
                  {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
