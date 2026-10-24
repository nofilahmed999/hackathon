import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateCompany } from "../../services/firestoreService";
import Card from "../../components/common/Card";
import { Building2, Clock, Globe, MapPin, Phone, Mail, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function CompanySettingsPage() {
  const { user, profile, company, refreshProfile } = useAuth();

  const [name, setName] = useState(company?.name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [address, setAddress] = useState(company?.address || "");
  const [timezone, setTimezone] = useState(company?.timezone || "Asia/Karachi");
  const [officeStartTime, setOfficeStartTime] = useState(company?.officeStartTime || "09:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(company?.gracePeriodMinutes || 15);
  const [halfDayThresholdHours, setHalfDayThresholdHours] = useState(company?.halfDayThresholdHours || 5);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!company?.id) return;

    try {
      setLoading(true);
      await updateCompany(
        company.id,
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          timezone,
          officeStartTime,
          gracePeriodMinutes: Number(gracePeriodMinutes),
          halfDayThresholdHours: Number(halfDayThresholdHours),
        },
        user.uid,
        profile?.name || "Admin"
      );
      await refreshProfile();
      toast.success("Company settings updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DBE2EF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Company Settings</h1>
          <p className="text-xs text-[#112D4E]/70 mt-0.5">
            Configure organization details, business rules, and attendance calculation parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <Card title="Organization Information" subtitle="Public company identity and contact info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
            </div>
          </div>
        </Card>

        <Card title="Attendance & Working Hours Policy" subtitle="Parameters used by server calculation algorithms">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Office Start Time
              </label>
              <input
                type="time"
                required
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
              <span className="text-[11px] text-[#112D4E]/60 mt-1 block">Default: 09:00</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
              <span className="text-[11px] text-[#112D4E]/60 mt-1 block">Checked-in after this is marked Late</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Half-Day Threshold (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={halfDayThresholdHours}
                onChange={(e) => setHalfDayThresholdHours(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              />
              <span className="text-[11px] text-[#112D4E]/60 mt-1 block">&lt; 5 hours counts as Half-Day</span>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT - UTC+05:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Save Company Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
