import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createCompany } from "../../services/firestoreService";
import { Building2, Clock, Globe, MapPin, Phone, Mail, ArrowRight, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function CompanySetupPage() {
  const { user, profile, company, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [officeStartTime, setOfficeStartTime] = useState("09:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [halfDayThresholdHours, setHalfDayThresholdHours] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If company is already set up, redirect to dashboard
  if (company?.id || profile?.companyId) {
    return (
      <div className="min-h-screen bg-[#F9F7F7] flex flex-col justify-center items-center p-6 text-center">
        <Building2 className="w-12 h-12 text-[#3F72AF] mb-3" />
        <h2 className="text-xl font-bold text-[#112D4E]">Company Already Configured</h2>
        <p className="text-sm text-[#112D4E]/70 max-w-sm mt-1">
          Your organization ({company?.name || "Configured"}) is already initialized.
        </p>
        <button
          onClick={() => navigate("/admin/dashboard", { replace: true })}
          className="mt-5 px-4 py-2 bg-[#3F72AF] text-white text-xs font-semibold rounded hover:bg-[#112D4E] transition-colors"
        >
          Proceed to Admin Dashboard
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter the official company name.");
      return;
    }

    try {
      setLoading(true);
      await createCompany(
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
      toast.success("Organization setup completed successfully!");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to complete company setup.");
      toast.error("Setup error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F7] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="px-6 py-2.5 rounded-xl bg-[#112D4E] flex items-center justify-center font-bold text-white text-lg tracking-widest border border-[#3F72AF]/50 gap-2">
            <Building2 className="w-5 h-5 text-[#DBE2EF]" />
            <span>HCM</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#112D4E]">
          Organization Onboarding
        </h2>
        <p className="mt-1 text-center text-xs text-[#112D4E]/70 max-w-md mx-auto">
          Welcome Administrator. Configure your company settings to activate employee directories, attendance rules, and role management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#DBE2EF] rounded-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Company Profile */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3F72AF] pb-2 border-b border-[#DBE2EF] mb-4">
                1. Company Information
              </h3>
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
                    placeholder="e.g. Acme Corporation Pvt Ltd"
                    className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
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
                      placeholder="+92 300 1234567"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Office Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, City, Country"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Attendance Policies */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3F72AF] pb-2 border-b border-[#DBE2EF] mb-4">
                2. Attendance Policies & Work Hours
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Office Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={officeStartTime}
                      onChange={(e) => setOfficeStartTime(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-[#112D4E]/60 mt-1 block">Default: 09:00 AM</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Grace Period (Mins)
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
                  <span className="text-[11px] text-[#112D4E]/60 mt-1 block">Late after 09:15</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Half-Day (Hours)
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
                  <span className="text-[11px] text-[#112D4E]/60 mt-1 block">&lt; 5 hours = half-day</span>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    System Timezone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                      <Globe className="w-4 h-4" />
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] bg-white focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    >
                      <option value="Asia/Karachi">Asia/Karachi (PKT - UTC+05:00)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DBE2EF]">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold text-white bg-[#3F72AF] hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Initialize Company & Open Dashboard"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
   
}
