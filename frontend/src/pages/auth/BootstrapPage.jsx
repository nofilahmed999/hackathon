import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { createInitialUserDoc, provisionUserWithSecondaryAuth, logActivity } from "../../services/firestoreService";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  AlertCircle,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const MASTER_RECOVERY_KEY = import.meta.env.VITE_ADMIN_RECOVERY_KEY || "HCM-ADMIN-RECOVER-2026";

export default function BootstrapPage() {
  const { user, profile, company, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [existingAdminEmail, setExistingAdminEmail] = useState("");
  const [existingCompanyId, setExistingCompanyId] = useState(null);
  const [error, setError] = useState("");

  // Recovery Mode States for unauthenticated recovery
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [recoveryUnlocked, setRecoveryUnlocked] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  const isAdminLoggedIn = profile?.role === "admin";
  const isOtherRoleLoggedIn = user && profile?.role && profile.role !== "admin";

  const verifyAdminExistence = async () => {
    try {
      setCheckingAdmin(true);
      setError("");

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "admin"), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const adminDoc = snap.docs[0].data();
        setAdminExists(true);
        setExistingAdminEmail(adminDoc.email || "");
        if (adminDoc.companyId) {
          setExistingCompanyId(adminDoc.companyId);
        }
      } else {
        setAdminExists(false);
        setExistingAdminEmail("");
      }
    } catch (err) {
      if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
        setAdminExists(false);
      } else {
        console.warn("Admin verification notice:", err.message);
      }
    } finally {
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    verifyAdminExistence();
  }, []);

  const handleVerifyRecoveryKey = (e) => {
    e.preventDefault();
    setRecoveryError("");

    if (!recoveryKey.trim()) {
      setRecoveryError("Please enter the Admin Recovery Key.");
      return;
    }

    if (recoveryKey.trim() !== MASTER_RECOVERY_KEY) {
      setRecoveryError("Invalid Recovery Key. Please check frontend/.env.");
      return;
    }

    setRecoveryUnlocked(true);
    setShowRecoveryModal(false);
    toast.success("Admin Recovery Key accepted. You may now create a replacement Admin account.");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAdminLoggedIn && adminExists && !recoveryUnlocked) {
      setError("Only Administrators can access bootstrap provisioning. Please sign in as an Admin.");
      return;
    }

    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const targetCompanyId = company?.id || profile?.companyId || existingCompanyId || null;

      // 1. If an Admin is already authenticated, provision via secondary auth so current admin session is not lost!
      if (isAdminLoggedIn) {
        const newUid = await provisionUserWithSecondaryAuth(email, password);
        const userDocRef = doc(db, "users", newUid);
        await setDoc(userDocRef, {
          uid: newUid,
          name,
          email,
          role: "admin",
          companyId: targetCompanyId,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (targetCompanyId) {
          await logActivity(
            targetCompanyId,
            user.uid,
            profile?.name || "Admin",
            "ADMIN_ACCOUNT_CREATED",
            "User",
            { name, email }
          );
        }

        toast.success(`Administrator account created for ${name}!`);
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        navigate("/admin/dashboard");
        return;
      }

      // 2. Unauthenticated bootstrap or recovery mode
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      let compId = targetCompanyId;
      if (!compId) {
        try {
          const compSnap = await getDocs(query(collection(db, "companies"), limit(1)));
          if (!compSnap.empty) {
            compId = compSnap.docs[0].id;
          }
        } catch (_) {}
      }

      await createInitialUserDoc(cred.user.uid, {
        name,
        email,
        role: "admin",
        companyId: compId,
      });

      await refreshProfile();
      toast.success("Administrator account provisioned successfully!");

      if (compId) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/admin/company-setup", { replace: true });
      }
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Try signing in or use another email.";
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-[#F9F7F7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#DBE2EF] border-t-[#3F72AF] rounded-full animate-spin" />
      </div>
    );
  }

  // Case 1: Logged-in non-admin (e.g. employee or HR) -> Access Restricted
  if (isOtherRoleLoggedIn) {
    const fallback = profile?.role === "hr" ? "/hr/dashboard" : "/employee/dashboard";
    return (
      <div className="min-h-screen bg-[#F9F7F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-8 border border-[#DBE2EF] rounded-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#112D4E]">Access Restricted</h2>
            <p className="text-xs text-[#112D4E]/70 max-w-sm mx-auto leading-relaxed">
              Your account role (<span className="font-semibold capitalize text-[#3F72AF]">{profile.role}</span>) is not authorized to access the Administrator Bootstrap portal. Only Administrators have provisioning privileges.
            </p>
            <div className="pt-2">
              <Link
                to={fallback}
                className="inline-block px-5 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] transition-colors"
              >
                Return to Your Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if form should be accessible
  const canAccessForm = isAdminLoggedIn || !adminExists || recoveryUnlocked;

  return (
    <div className="min-h-screen bg-[#F9F7F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="px-6 py-2.5 rounded-xl bg-[#112D4E] flex items-center justify-center font-bold text-white text-lg tracking-widest border border-[#3F72AF]/50 gap-2">
            <ShieldCheck className="w-5 h-5 text-[#DBE2EF]" />
            <span>HCM</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#112D4E]">
          {isAdminLoggedIn
            ? "Administrator Provisioning Portal"
            : recoveryUnlocked
            ? "Emergency Admin Re-creation"
            : "Administrator Bootstrap"}
        </h2>
        <p className="mt-1 text-center text-xs text-[#112D4E]/70">
          {isAdminLoggedIn
            ? "Authorized Administrator: create and provision additional Admin accounts"
            : recoveryUnlocked
            ? "Recovery mode active: provision replacement Administrator credentials"
            : "Initial setup portal for Organization Master Administrator"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#DBE2EF] rounded-xl">
          {/* Case 2: Unauthenticated and an Admin already exists -> Prompt to Sign In as Admin */}
          {!canAccessForm && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#112D4E]">Admin Sign-In Required</h3>
                <p className="text-xs text-[#112D4E]/70 max-w-sm mx-auto mt-1.5 leading-relaxed">
                  An Administrator account is already registered for this organization
                  {existingAdminEmail ? (
                    <span className="font-semibold text-[#112D4E]"> ({existingAdminEmail})</span>
                  ) : (
                    ""
                  )}
                  . Only Administrators are permitted to access bootstrap and provision accounts.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#3F72AF] hover:bg-[#112D4E] transition-all"
                >
                  Sign In as Admin
                </Link>

                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-xs font-semibold text-[#112D4E] bg-[#F9F7F7] border border-[#DBE2EF] hover:bg-[#DBE2EF]/40 transition-colors"
                >
                  Admin Account Deleted? Recreate with Recovery Key
                </button>
              </div>
            </div>
          )}

          {/* Registration Form: Visible to authenticated Admin, initial setup, or unlocked recovery */}
          {canAccessForm && (
            <>
              <div className="mb-6 pb-4 border-b border-[#DBE2EF]">
                <h3 className="text-base font-semibold text-[#112D4E]">
                  {isAdminLoggedIn
                    ? "Provision Administrator Account"
                    : recoveryUnlocked
                    ? "Create Replacement Admin"
                    : "Master Admin Registration"}
                </h3>
                <p className="text-xs text-[#112D4E]/60 mt-0.5">
                  {isAdminLoggedIn
                    ? `Authenticated as ${profile?.name || "Administrator"}. Enter credentials for new Admin.`
                    : recoveryUnlocked
                    ? "Fill in your credentials to restore master administrative control."
                    : "Create your primary organizational administrator credentials."}
                </p>
                {isAdminLoggedIn && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-[#3F72AF] shrink-0" />
                    <span>Admin Session Active ({profile.email})</span>
                  </div>
                )}
                {recoveryUnlocked && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Recovery mode verified. Enter replacement credentials below.</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Admin Full Name *
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
                      placeholder="e.g. John Doe"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Admin Email Address *
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
                      placeholder="admin@company.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Admin Password (min. 6 characters) *
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
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#112D4E]/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] placeholder-[#112D4E]/40 focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold text-white bg-[#3F72AF] hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isAdminLoggedIn ? (
                      "Provision Admin Account"
                    ) : recoveryUnlocked ? (
                      "Recreate Admin Account"
                    ) : (
                      "Create Admin Account"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-[#DBE2EF] text-center">
                <p className="text-xs text-[#112D4E]/70">
                  {isAdminLoggedIn ? (
                    <Link to="/admin/dashboard" className="font-semibold text-[#3F72AF] hover:underline">
                      &larr; Back to Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      Already have an active account?{" "}
                      <Link to="/login" className="font-semibold text-[#3F72AF] hover:underline">
                        Sign In
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#112D4E]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#DBE2EF] w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#DBE2EF]">
              <div className="p-2 rounded-lg bg-[#3F72AF]/10 text-[#3F72AF]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#112D4E]">Admin Recovery Key</h3>
                <p className="text-xs text-[#112D4E]/60">Unlock and recreate a deleted admin account</p>
              </div>
            </div>

            <form onSubmit={handleVerifyRecoveryKey} className="mt-4 space-y-4">
              <p className="text-xs text-[#112D4E]/70 leading-relaxed">
                If the previous administrator was deleted, enter the <strong>Master Recovery Key</strong> to unlock bootstrap registration:
              </p>

              {recoveryError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {recoveryError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#112D4E] uppercase tracking-wider mb-1">
                  Master Recovery Key
                </label>
                <input
                  type="password"
                  required
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder="e.g. HCM-ADMIN-RECOVER-2026"
                  className="block w-full px-3.5 py-2.5 border border-[#DBE2EF] rounded-lg text-sm text-[#112D4E] font-mono focus:outline-none focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20"
                />
                <span className="text-[11px] text-[#112D4E]/50 mt-1 block">
                  Configured key: <code className="font-mono text-[#3F72AF]">{MASTER_RECOVERY_KEY}</code>
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-[#DBE2EF]">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#DBE2EF] text-xs font-semibold text-[#112D4E] hover:bg-[#F9F7F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#3F72AF] text-white text-xs font-semibold hover:bg-[#112D4E] transition-all"
                >
                  Unlock Admin Re-creation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
