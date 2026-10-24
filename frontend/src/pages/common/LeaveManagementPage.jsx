import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCompanyLeaveRequests,
  updateLeaveStatus,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CalendarClock, Check, X, Filter, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LeaveManagementPage() {
  const { user, profile, company } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Review modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved"); // approved or rejected
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await getCompanyLeaveRequests(company.id);
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [company?.id]);

  const handleOpenReview = (req, action) => {
    setSelectedReq(req);
    setReviewAction(action);
    setDecisionNote("");
  };

  const handleConfirmReview = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      setSubmitting(true);
      const reviewer = { uid: user.uid, name: profile?.name || "Reviewer" };
      await updateLeaveStatus(
        company.id,
        selectedReq.id,
        reviewAction,
        decisionNote.trim(),
        reviewer
      );

      toast.success(`Leave request marked as ${reviewAction}.`);
      setSelectedReq(null);
      await loadRequests();
    } catch (err) {
      console.error(err);
      toast.error("Review update error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Leave Approvals & Requests</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Evaluate employee absence petitions, track quotas, and issue official review remarks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#112D4E]/60 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#DBE2EF] rounded-lg px-3 py-2 text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
          >
            <option value="all">All Statuses ({requests.length})</option>
            <option value="pending">
              Pending ({requests.filter((r) => r.status === "pending").length})
            </option>
            <option value="approved">
              Approved ({requests.filter((r) => r.status === "approved").length})
            </option>
            <option value="rejected">
              Rejected ({requests.filter((r) => r.status === "rejected").length})
            </option>
          </select>
        </div>
      </div>

      <Card
        title="Leave Applications"
        subtitle={`Showing ${filteredRequests.length} leave application(s)`}
      >
        {loading ? (
          <LoadingSpinner message="Loading leave petitions from Cloud Firestore..." />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No Leave Petitions Found"
            description="When employees file absence requests, they will populate here for administrative evaluation."
            icon={CalendarClock}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F9F7F7]/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#112D4E]">{req.employeeName}</div>
                      <div className="font-mono text-[10px] text-[#112D4E]/60">{req.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#112D4E]">{req.leaveType}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#112D4E]">
                      {req.startDate} <span className="text-[#112D4E]/40">to</span> {req.endDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#112D4E]">
                      {req.workingDays} day(s)
                    </td>
                    <td className="py-3 px-4 text-[#112D4E]/80 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === "pending" ? (
                        <div className="inline-flex space-x-1.5">
                          <button
                            onClick={() => handleOpenReview(req, "approved")}
                            className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white font-medium transition-colors"
                            title="Approve leave"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(req, "rejected")}
                            className="px-3 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white font-medium transition-colors"
                            title="Reject leave"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#112D4E]/60">
                          {req.reviewedByName ? `By ${req.reviewedByName}` : "Processed"}
                          {req.decisionNote && (
                            <span className="block italic text-[10px] text-[#112D4E]/50 truncate max-w-[120px]">
                              "{req.decisionNote}"
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={reviewAction === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
      >
        <form onSubmit={handleConfirmReview} className="space-y-4">
          <div className="p-3 rounded bg-[#F9F7F7] border border-[#DBE2EF] text-xs space-y-1">
            <p>
              <strong className="text-[#112D4E]">Employee:</strong> {selectedReq?.employeeName} ({selectedReq?.employeeCode})
            </p>
            <p>
              <strong className="text-[#112D4E]">Leave Type:</strong> {selectedReq?.leaveType}
            </p>
            <p>
              <strong className="text-[#112D4E]">Duration:</strong> {selectedReq?.startDate} to {selectedReq?.endDate} ({selectedReq?.workingDays} working days)
            </p>
            <p>
              <strong className="text-[#112D4E]">Stated Reason:</strong> {selectedReq?.reason}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Decision Remark / Feedback Note
            </label>
            <textarea
              rows={3}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="e.g. Approved as per project availability / Rejected due to scheduled milestone..."
              className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            />
          </div>

          <div className="pt-3 border-t border-[#DBE2EF] flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setSelectedReq(null)}
              className="px-4 py-2.5 border border-[#DBE2EF] text-[#112D4E] text-xs font-semibold rounded-lg hover:bg-[#F9F7F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 text-white text-xs font-semibold rounded-lg active:scale-[0.99] transition-all disabled:opacity-50 ${
                reviewAction === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting
                ? "Processing..."
                : reviewAction === "approved"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
