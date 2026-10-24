import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getEmployeeByUserId,
  getBiometricTemplate,
  getTodayAttendance,
  getEmployeeAttendanceList,
  getEmployeeLeaveRequests,
  getDepartments,
  getTodayDateKey,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ScanFace,
  CalendarCheck,
  CalendarClock,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
  const { user, profile, company } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [enrolledTemplate, setEnrolledTemplate] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const compId = company?.id || profile?.companyId;

        const [emp, bio, depts] = await Promise.all([
          getEmployeeByUserId(user.uid),
          getBiometricTemplate(user.uid),
          compId ? getDepartments(compId) : [],
        ]);

        setEmployee(emp);
        setEnrolledTemplate(bio);

        if (emp?.departmentId && depts.length > 0) {
          const d = depts.find((item) => item.id === emp.departmentId);
          if (d) setDepartmentName(d.name);
        }

        if (emp?.id && compId) {
          const [todayAtt, history, leaves] = await Promise.all([
            getTodayAttendance(compId, emp.id, getTodayDateKey()),
            getEmployeeAttendanceList(compId, emp.id),
            getEmployeeLeaveRequests(compId, emp.id),
          ]);
          setTodayAttendance(todayAtt);
          setAttendanceHistory(history);
          setLeaveRequests(leaves);
        }
      } catch (err) {
        console.error("Employee dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid, company?.id]);

  if (loading) {
    return <LoadingSpinner message="Loading employee portal from Cloud Firestore..." />;
  }

  const presentDays = attendanceHistory.filter((a) => a.status === "present" || a.status === "late").length;
  const approvedLeaves = leaveRequests.filter((l) => l.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#DBE2EF] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3F72AF]">
            Employee Self-Service Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E] mt-0.5">
            Welcome, {employee?.name || profile?.name || "Staff Member"}
          </h1>
          <p className="text-xs text-[#112D4E]/70 mt-1">
            Staff Code: <span className="font-mono font-semibold text-[#112D4E]">{employee?.employeeCode || "EMP-01"}</span> · Department: {departmentName || "General Staff"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/employee/attendance"
            className="px-4 py-2 text-xs font-semibold bg-[#3F72AF] text-white rounded-lg hover:bg-[#112D4E] transition-colors"
          >
            Face Attendance
          </Link>
          <Link
            to="/employee/leaves"
            className="px-4 py-2 text-xs font-semibold bg-[#112D4E] text-white rounded-lg hover:bg-[#3F72AF] transition-colors"
          >
            Apply Leave
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Today's Attendance
          </span>
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={todayAttendance?.status || "Not Checked In"} />
            <span className="font-mono text-xs text-[#112D4E]/70 font-semibold">
              {todayAttendance?.checkInTimeStr || "Pending"}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Days Present (This Month)
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700">{presentDays}</span>
            <span className="text-xs text-[#112D4E]/60">shifts logged</span>
          </div>
        </div>

        <div className="bg-white border border-[#DBE2EF] rounded-lg p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#112D4E]/60">
            Biometric Profile
          </span>
          <div className="mt-2 flex items-center justify-between">
            {enrolledTemplate ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Enrolled
              </span>
            ) : (
              <Link
                to="/employee/enrollment"
                className="inline-flex items-center text-xs font-semibold text-amber-700 hover:underline"
              >
                <AlertCircle className="w-4 h-4 mr-1" /> Action Required &rarr;
              </Link>
            )}
            <Link
              to="/employee/enrollment"
              className="text-[11px] text-[#3F72AF] font-medium hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance & Leave Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <Card
          title="Recent Attendance History"
          subtitle="Your personal biometric timecard logs"
          action={
            <Link to="/employee/attendance" className="text-xs text-[#3F72AF] font-semibold hover:underline">
              Check In &rarr;
            </Link>
          }
        >
          {attendanceHistory.length === 0 ? (
            <EmptyState
              title="No Attendance Logs"
              description="Your attendance logs will appear here once you complete daily face check-ins."
              icon={CalendarCheck}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">In</th>
                    <th className="py-2.5 px-3">Out</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DBE2EF]">
                  {attendanceHistory.slice(0, 7).map((att) => (
                    <tr key={att.id} className="hover:bg-[#F9F7F7]/60">
                      <td className="py-2.5 px-3 font-mono font-medium">{att.dateKey}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{att.checkInTimeStr || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{att.checkOutTimeStr || "—"}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={att.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Leave Requests */}
        <Card
          title="Leave Requests"
          subtitle="Status of your absence petitions"
          action={
            <Link to="/employee/leaves" className="text-xs text-[#3F72AF] font-semibold hover:underline">
              View All &rarr;
            </Link>
          }
        >
          {leaveRequests.length === 0 ? (
            <EmptyState
              title="No Leave Petitions"
              description="You have not submitted any leave requests yet."
              icon={CalendarClock}
            />
          ) : (
            <div className="divide-y divide-[#DBE2EF]">
              {leaveRequests.slice(0, 5).map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#112D4E]">{l.leaveType}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="text-[11px] text-[#112D4E]/60 mt-0.5">
                      {l.startDate} to {l.endDate} ({l.workingDays} working days)
                    </p>
                  </div>
                  {l.decisionNote && (
                    <span className="text-[10px] italic text-[#112D4E]/60 max-w-[120px] truncate" title={l.decisionNote}>
                      "{l.decisionNote}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
