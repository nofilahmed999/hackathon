import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeDirectoryPage() {
  const { user, profile, company } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [employmentType, setEmploymentType] = useState("full-time");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [emps, depts] = await Promise.all([
        getEmployees(company.id),
        getDepartments(company.id),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      if (depts.length > 0 && !departmentId) {
        setDepartmentId(depts[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !password || !employeeCode) {
      setFormError("Please fill in all mandatory fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Temporary password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const actor = { uid: user.uid, name: profile?.name || "HR Officer" };

      await createEmployee(
        company.id,
        {
          name: name.trim(),
          email: email.trim(),
          password,
          employeeCode: employeeCode.trim().toUpperCase(),
          phone: phone.trim(),
          departmentId,
          designation: designation.trim(),
          joiningDate,
          employmentType,
        },
        actor
      );

      toast.success(`Employee "${name}" provisioned successfully!`);
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setEmployeeCode("");
      setPhone("");
      setDesignation("");
      await loadData();
    } catch (err) {
      console.error(err);
      let msg = err.message || "Failed to provision employee.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      }
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    const confirmMsg = `Are you sure you want to mark ${emp.name} as ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const actor = { uid: user.uid, name: profile?.name || "HR Officer" };
      await toggleEmployeeStatus(company.id, emp.id, emp.userId, newStatus, actor);
      toast.success(`Employee status set to ${newStatus}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Status update error: " + err.message);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === "all" || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Employee Directory</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Manage company personnel records, login credential provisioning, and biometric face enrollment.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all"
        >
          Add Employee
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DBE2EF] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, or email..."
            className="block w-full pl-10 pr-3.5 py-2 border border-[#DBE2EF] rounded-lg text-xs text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#112D4E]/60 font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-[#DBE2EF] rounded-lg px-3 py-2 text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#112D4E]/60 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-[#DBE2EF] rounded-lg px-3 py-2 text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <Card title="Personnel Roster" subtitle={`Showing ${filteredEmployees.length} of ${employees.length} employee(s)`}>
        {loading ? (
          <LoadingSpinner message="Loading employee directory..." />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            title="No Employees Found"
            description={
              employees.length === 0
                ? "Your company has no registered employees yet. Click below to provision your first staff member."
                : "No employees match the applied filter criteria."
            }
            icon={Users}
            actionText={employees.length === 0 ? "Provision Employee" : undefined}
            onAction={employees.length === 0 ? () => setIsModalOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {filteredEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  return (
                    <tr key={emp.id} className="hover:bg-[#F9F7F7]/60">
                      <td className="py-3 px-4 font-mono font-semibold text-[#112D4E]">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#112D4E]">{emp.name}</div>
                        <div className="text-[11px] text-[#112D4E]/60">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4 text-[#112D4E]">
                        {dept?.name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-[#112D4E]/80">
                        {emp.designation || "Staff"}
                      </td>
                      <td className="py-3 px-4 text-[#112D4E]/70 font-mono text-[11px]">
                        {emp.phone || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-3 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            emp.status === "active"
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          {emp.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Employee Account" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Employee Code * (Unique)
              </label>
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="e.g. EMP-101"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm font-mono text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Official Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Initial Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              >
                {departments.length === 0 ? (
                  <option value="">No departments available</option>
                ) : (
                  departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Designation / Job Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Date of Joining
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
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
              {submitting ? "Provisioning..." : "Create Employee Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
