import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getDepartments,
  getEmployees,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FolderTree, Plus, Edit2, Trash2, Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function DepartmentManagementPage() {
  const { user, profile, company } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [depts, emps] = await Promise.all([
        getDepartments(company.id),
        getEmployees(company.id),
      ]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName("");
    setDescription("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Department name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const actor = { uid: user.uid, name: profile?.name || "Admin" };

      if (editingDept) {
        await updateDepartment(company.id, editingDept.id, { name, description }, actor);
        toast.success(`Department "${name}" updated.`);
      } else {
        await createDepartment(company.id, { name, description }, actor);
        toast.success(`Department "${name}" created.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Failed to save department.");
      toast.error("Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
      return;
    }

    try {
      const actor = { uid: user.uid, name: profile?.name || "Admin" };
      await deleteDepartment(company.id, dept.id, dept.name, actor);
      toast.success(`Department "${dept.name}" deleted.`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Department Management</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Organize company personnel into distinct units with real-time headcount aggregation.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all"
        >
          Add Department
        </button>
      </div>

      <Card title="Company Departments" subtitle={`Total ${departments.length} functional department(s)`}>
        {loading ? (
          <LoadingSpinner message="Loading departments..." />
        ) : departments.length === 0 ? (
          <EmptyState
            title="No Departments Configured"
            description="Create organizational departments (e.g., Engineering, Sales, Human Resources) to categorize employees."
            icon={FolderTree}
            actionText="Add First Department"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F7F7] text-[#112D4E] uppercase text-[10px] tracking-wider border-b border-[#DBE2EF]">
                <tr>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Assigned Personnel</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF]">
                {departments.map((dept) => {
                  const count = employees.filter((e) => e.departmentId === dept.id).length;
                  return (
                    <tr key={dept.id} className="hover:bg-[#F9F7F7]/60">
                      <td className="py-3 px-4 font-semibold text-[#112D4E] flex items-center space-x-2">
                        <FolderTree className="w-4 h-4 text-[#3F72AF]" />
                        <span>{dept.name}</span>
                      </td>
                      <td className="py-3 px-4 text-[#112D4E]/70">{dept.description || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#DBE2EF]/50 text-[#112D4E] font-medium text-[11px]">
                          <Users className="w-3 h-3 mr-1 text-[#3F72AF]" />
                          {count} employee(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-[#3F72AF] hover:bg-[#3F72AF]/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Delete
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

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? "Edit Department" : "Add New Department"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Information Technology"
              className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
              Description / Responsibilities
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of department function..."
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
              {submitting ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
