import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCompanyAttendanceForDate,
  getEmployees,
  getTodayDateKey,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CalendarCheck, Calendar, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendanceRecordsPage() {
  const { company } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAttendance = async (dateKey) => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [attData, empData] = await Promise.all([
        getCompanyAttendanceForDate(company.id, dateKey),
        getEmployees(company.id),
      ]);
      setAttendanceList(attData);
      setEmployees(empData.filter((e) => e.status === "active"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [company?.id, selectedDate]);

  const presentCount = attendanceList.filter((a) => a.status === "present").length;
  const lateCount = attendanceList.filter((a) => a.status === "late").length;
  const halfDayCount = attendanceList.filter((a) => a.status === "half-day").length;
  const totalActive = employees.length;
  const missingCount = Math.max(0, totalActive - attendanceList.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Daily Attendance Records</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Biometric face verification audit log and daily timecard register.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-[#DBE2EF] rounded-lg px-3.5 py-2">
          <Calendar className="w-4 h-4 text-[#3F72AF]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs text-[#112D4E] font-medium bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-3">
          <span className="text-[11px] text-[#112D4E]/60 font-semibold uppercase">Total Checked-In</span>
          <div className="text-xl font-bold text-[#112D4E] mt-1">
            {attendanceList.length} <span className="text-xs text-[#112D4E]/60">/ {totalActive}</span>
          </div>
        </div>
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-3">
          <span className="text-[11px] text-emerald-800 font-semibold uppercase">On-Time (Present)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{presentCount}</div>
        </div>
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-3">
          <span className="text-[11px] text-amber-800 font-semibold uppercase">Late Arrivals</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{lateCount}</div>
        </div>
        <div className="bg-white border border-[#DBE2EF] rounded-lg p-3">
          <span className="text-[11px] text-[#112D4E]/60 font-semibold uppercase">Pending / Absent</span>
          <div className="text-xl font-bold text-[#112D4E]/80 mt-1">{missingCount}</div>
        </div>
      </div>

      <Card
        title={`Attendance Register — ${selectedDate}`}
        subtitle={`Showing ${attendanceList.length} recorded biometric check-in(s)`}
      >
        {loading ? (
          <LoadingSpinner message="Querying attendance records for selected date..." />
        ) : attendanceList.length === 0 ? (
          <EmptyState
            title="No Attendance Recorded"
            description={`No face-verified attendance has been logged for ${selectedDate}.`}
            icon={CalendarCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Work Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {attendanceList.map((att) => (
                  <tr key={att.id} className="hover:bg-[#F9F7F7]/60">
                    <td className="py-3 px-4 font-mono font-semibold text-[#112D4E]">
                      {att.employeeCode || "—"}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#112D4E]">
                      {att.employeeName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#112D4E]">
                      {att.checkInTimeStr || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#112D4E]">
                      {att.checkOutTimeStr || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#112D4E]">
                      {att.workingHours ? `${att.workingHours} hrs` : "In Progress"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={att.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#DBE2EF]/50 text-[#112D4E] text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Face Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
