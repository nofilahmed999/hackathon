import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCompanyMetrics, getTodayDateKey } from "../../services/firestoreService";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Users,
  CalendarCheck,
  CalendarClock,
  UserPlus,
  FolderTree,
  ArrowRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function HRDashboard() {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [company?.id]);

  if (loading) {
    return <LoadingSpinner message="Loading HR analytics from Cloud Firestore..." />;
  }

  const employees = metrics?.employees || [];
  const activeEmployees = employees.filter((e) => e.status === "active");
  const departments = metrics?.departments || [];
  const todayAttendance = metrics?.todayAttendance || [];
  const leaveRequests = metrics?.leaveRequests || [];
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");

  const deptChartData = departments.map((d) => ({
    name: d.name,
    employees: employees.filter((e) => e.departmentId === d.id).length,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#DBE2EF] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3F72AF]">
            Human Resources Management
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E] mt-0.5">
            HR Operations Hub
          </h1>
          <p className="text-xs text-[#112D4E]/70 mt-1">
            Managing {company?.name || "Organization"} personnel and daily operations for {getTodayDateKey()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/hr/employees"
            className="px-4 py-2 text-xs font-semibold bg-[#3F72AF] text-white rounded-lg hover:bg-[#112D4E] transition-colors"
          >
            Provision Employee
          </Link>
          <Link
            to="/hr/leaves"
            className="px-4 py-2 text-xs font-semibold bg-[#112D4E] text-white rounded-lg hover:bg-[#3F72AF] transition-colors"
          >
            Review Leaves ({pendingLeaves.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Active Personnel
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#112D4E]">{activeEmployees.length}</span>
            <span className="text-xs text-[#112D4E]/60">registered employees</span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Checked-In Today
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700">{todayAttendance.length}</span>
            <span className="text-xs text-[#112D4E]/60">face-verified records</span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Pending Leave Petitions
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-700">{pendingLeaves.length}</span>
            <span className="text-xs text-[#112D4E]/60">awaiting decision</span>
          </div>
        </div>
      </div>

      {/* Charts & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card title="Department Staffing" subtitle="Distribution of workforce across departments">
          {departments.length === 0 ? (
            <EmptyState
              title="No Departments"
              description="Configure departments to structure employee rosters."
              icon={FolderTree}
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

        {/* Pending Actions */}
        <Card
          title="Pending Leave Applications"
          subtitle="Requests requiring official decision note"
          action={
            <Link to="/hr/leaves" className="text-xs text-[#3F72AF] font-semibold hover:underline">
              Process All &rarr;
            </Link>
          }
        >
          {pendingLeaves.length === 0 ? (
            <EmptyState
              title="Inbox Clear"
              description="No leave requests currently require review."
              icon={CalendarClock}
            />
          ) : (
            <div className="divide-y divide-[#DBE2EF]">
              {pendingLeaves.slice(0, 5).map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#112D4E]">{l.employeeName}</span>
                    <span className="text-[#112D4E]/60 font-mono text-[10px] ml-2">
                      ({l.leaveType} · {l.workingDays} days)
                    </span>
                    <p className="text-[11px] text-[#112D4E]/70 mt-0.5 truncate max-w-xs">{l.reason}</p>
                  </div>
                  <Link
                    to="/hr/leaves"
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[11px] hover:bg-amber-100"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
