import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return;

    try {
      setLoading(true);
      await resetPassword(email);
      setSubmitted(true);
      toast.success("Password reset instructions sent.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send reset link.");
      toast.error("Error sending reset email.");
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
          Reset Password
        </h2>
        <p className="mt-1 text-center text-xs text-[#112D4E]/70">
          Enter your registered email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#DBE2EF] rounded-xl">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-semibold text-[#112D4E]">Email Dispatched</h3>
              <p className="text-xs text-[#112D4E]/70 leading-relaxed">
                If an account exists for <span className="font-semibold text-[#112D4E]">{email}</span>, a reset link has been dispatched to your inbox.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-[#3F72AF] hover:underline pt-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                  Registered Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold text-white bg-[#3F72AF] hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-[#112D4E]/70 hover:text-[#3F72AF] font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
