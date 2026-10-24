import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCompanyUsers, createHRUser } from "../../services/firestoreService";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { UserCheck, UserPlus, Mail, Phone, Lock, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function HRManagementPage() {
  const { user, profile, company } = useAuth();
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadHRUsers = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const data = await getCompanyUsers(company.id, "hr");
      setHrUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load HR users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHRUsers();
  }, [company?.id]);

  const handleCreateHR = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !password) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await createHRUser(
        company.id,
        {
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
        },
        { uid: user.uid, name: profile?.name || "Admin" }
      );

      toast.success(`HR user "${name}" provisioned successfully!`);
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      await loadHRUsers();
    } catch (err) {
      console.error(err);
      let msg = err.message || "Failed to provision HR account.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email address already exists.";
      }
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">HR Team Management</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Administers HR accounts authorized to register employees, review leave requests, and manage attendance.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all"
        >
          Provision HR User
        </button>
      </div>

      <Card title="Authorized HR Officers" subtitle={`Total ${hrUsers.length} active HR officer(s) in ${company?.name}`}>
        {loading ? (
          <LoadingSpinner message="Loading HR accounts..." />
        ) : hrUsers.length === 0 ? (
          <EmptyState
            title="No HR Accounts Provisioned"
            description="Create your company's first HR officer to delegate employee onboarding and leave approvals."
            icon={UserCheck}
            actionText="Provision HR User"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Provisioned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {hrUsers.map((hr) => (
                  <tr key={hr.id} className="hover:bg-[#F9F7F7]/60">
                    <td className="py-3 px-4 font-semibold text-[#112D4E] flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-[#112D4E] text-white flex items-center justify-center font-bold text-[10px]">
                        {hr.name?.charAt(0) || "H"}
                      </div>
                      <span>{hr.name}</span>
                    </td>
                    <td className="py-3 px-4 text-[#112D4E]/80">{hr.email}</td>
                    <td className="py-3 px-4 text-[#112D4E]/70">{hr.phone || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#3F72AF]/10 text-[#3F72AF] font-semibold uppercase text-[10px]">
                        HR Manager
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={hr.status || "active"} />
                    </td>
                    <td className="py-3 px-4 text-right text-[#112D4E]/60 font-mono">
                      {hr.createdAt?.toDate ? hr.createdAt.toDate().toLocaleDateString() : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Provision HR Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New HR Officer">
        <form onSubmit={handleCreateHR} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Work Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.hr@company.com"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Temporary Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Contact Phone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
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
              {submitting ? "Provisioning..." : "Create HR Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
