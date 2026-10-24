import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      const { profile } = await login(email, password);
      toast.success("Welcome back!");

      // Route based on role
      if (profile?.role === "admin") {
        if (!profile.companyId) {
          navigate("/admin/company-setup", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else if (profile?.role === "hr") {
        navigate("/hr/dashboard", { replace: true });
      } else {
        navigate("/employee/dashboard", { replace: true });
      }
    } catch (err) {
      console.error(err);
      let msg = "Invalid credentials. Please verify your email and password.";
      if (err.code === "auth/user-not-found") msg = "No user found with this email.";
      if (err.code === "auth/wrong-password") msg = "Incorrect password.";
      if (err.code === "auth/too-many-requests") msg = "Too many failed attempts. Try again later.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="px-6 py-2.5 rounded-xl bg-[#112D4E] flex items-center justify-center font-bold text-white text-lg tracking-widest border border-[#3F72AF]/50">
            HCM
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#112D4E]">
          HCM Lite
        </h2>
        <p className="mt-1 text-center text-xs text-[#112D4E]/70 font-medium">
          Human Capital Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#DBE2EF] rounded-xl">
          <div className="mb-6 pb-4 border-b border-[#DBE2EF]">
            <h3 className="text-base font-semibold text-[#112D4E]">Sign In to Portal</h3>
            <p className="text-xs text-[#112D4E]/60 mt-0.5">
              Enter your credentials to access your organization portal.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                Work Email
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
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#3F72AF] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold text-white bg-[#3F72AF] hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#DBE2EF] text-center">
            <p className="text-xs text-[#112D4E]/70">
              Need initial setup or admin recovery?{" "}
              <Link
                to="/bootstrap"
                className="font-semibold text-[#3F72AF] hover:underline"
              >
                One-Time Admin Setup & Recovery
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
