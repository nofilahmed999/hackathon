import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getEmployeeByUserId,
  getEmployeeLeaveRequests,
  submitLeaveRequest,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CalendarClock, Plus, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeLeavesPage() {
  const { user, profile, company } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const emp = await getEmployeeByUserId(user.uid);
      setEmployee(emp);

      if (emp?.id && (company?.id || profile?.companyId)) {
        const compId = company?.id || profile.companyId;
        const data = await getEmployeeLeaveRequests(compId, emp.id);
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, company?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!reason.trim()) {
      setFormError("Please provide a reason for your absence.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }

    try {
      setSubmitting(true);
      const compId = company?.id || profile?.companyId;
      const emp = employee || {
        id: "EMP-" + user.uid.substring(0, 5),
        userId: user.uid,
        name: profile?.name || "Employee",
        employeeCode: "EMP-01",
      };

      await submitLeaveRequest(compId, emp, {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      toast.success("Leave application submitted for HR review.");
      setIsModalOpen(false);
      setReason("");
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Failed to submit request.");
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">My Leave Applications</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Submit absence petitions and inspect administrative review statuses.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all"
        >
          Apply for Leave
        </button>
      </div>

      <Card title="Submitted Leave Applications" subtitle={`Total ${requests.length} request(s) on file`}>
        {loading ? (
          <LoadingSpinner message="Loading leave applications from Firestore..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Leave Petitions"
            description="You have not submitted any absence requests. Click below to file an application."
            icon={CalendarClock}
            actionText="Apply for Leave"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F9F7F7]/60">
                    <td className="py-3 px-4 font-semibold text-[#112D4E]">{r.leaveType}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{r.startDate}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{r.endDate}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{r.workingDays} day(s)</td>
                    <td className="py-3 px-4 text-[#112D4E]/80 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-[11px] text-[#112D4E]/60">
                      {r.decisionNote ? `"${r.decisionNote}"` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Absence / Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Leave Category *
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            >
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Reason for Absence *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the purpose of your leave request..."
              className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            />
          </div>

          <div className="pt-3 border-t border-[#DBE2EF] flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-[#DBE2EF] text-[#112D4E] text-xs font-semibold rounded-lg hover:bg-[#F9F7F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
