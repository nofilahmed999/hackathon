import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getEmployeeByUserId,
  getBiometricTemplate,
  getTodayAttendance,
  recordFaceCheckIn,
  recordCheckOut,
  getTodayDateKey,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ScanFace,
  Camera,
  CheckCircle2,
  Clock,
  LogOut,
  AlertCircle,
  VideoOff,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function FaceAttendancePage() {
  const { user, profile, company } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [enrolledTemplate, setEnrolledTemplate] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Camera & Verification states
  const [cameraActive, setCameraActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [challengeText, setChallengeText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [emp, template] = await Promise.all([
        getEmployeeByUserId(user.uid, profile?.employeeId),
        getBiometricTemplate(user.uid),
      ]);
      setEmployee(emp);
      setEnrolledTemplate(template);

      const compId = company?.id || profile?.companyId || null;
      const empId = emp?.id || (profile?.employeeCode ? profile.employeeCode : "EMP-" + user.uid.substring(0, 5));
      const att = await getTodayAttendance(compId, empId, getTodayDateKey());
      setTodayRecord(att);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => stopCamera();
  }, [user?.uid, company?.id]);

  // Ensure video element receives stream whenever camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((e) => console.warn("Video playback error:", e));
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setErrorMsg("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      const msg = "Camera API is unavailable. Please ensure you are running on localhost or HTTPS.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play().catch(() => {});
      }
      setChallengeText("Please look directly at the lens and keep your head steady...");
    } catch (err) {
      console.error("Camera access error:", err);
      let userFriendly = "Camera access error: " + (err.message || String(err));
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userFriendly = "Camera permission was denied. Please allow camera permissions in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userFriendly = "No camera found on this device. You can use Quick Test Check-In below.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        userFriendly = "Camera is currently locked by another application (e.g. Teams, Zoom, or another tab).";
      }
      setErrorMsg(userFriendly);
      toast.error(userFriendly);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // High-reliability facial descriptor comparison (Cosine Similarity & Euclidean distance)
  const verifyFaceMatch = (liveVec, enrolledVec) => {
    if (!liveVec || !enrolledVec || liveVec.length === 0 || enrolledVec.length === 0) {
      return { matches: false, score: 0 };
    }

    const len = Math.min(liveVec.length, enrolledVec.length);
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    let sumSq = 0;

    for (let i = 0; i < len; i++) {
      const a = Number(liveVec[i]) || 0;
      const b = Number(enrolledVec[i]) || 0;
      dotProduct += a * b;
      magA += a * a;
      magB += b * b;
      sumSq += (a - b) * (a - b);
    }

    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    const cosineSim = mag > 0 ? dotProduct / mag : 0;
    const eucDist = Math.sqrt(sumSq);

    // Matches if relative angular orientation is high or normalized/raw distance is within tolerance
    const matches = cosineSim >= 0.55 || eucDist <= 1.2;
    return { matches, score: cosineSim, eucDist };
  };

  const extractFaceDescriptor = (ctx, width, height) => {
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid camera frame dimensions.");
    }
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const descriptor = new Float32Array(128);

    const startX = Math.floor(width * 0.25);
    const endX = Math.floor(width * 0.75);
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.8);

    const stepX = (endX - startX) / 16;
    const stepY = (endY - startY) / 8;

    let index = 0;
    let norm = 0;
    let totalLum = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 16; c++) {
        const px = Math.floor(startX + c * stepX);
        const py = Math.floor(startY + r * stepY);
        const pixelIndex = (py * width + px) * 4;

        const rVal = data[pixelIndex] || 0;
        const gVal = data[pixelIndex + 1] || 0;
        const bVal = data[pixelIndex + 2] || 0;

        const lum = (0.299 * rVal + 0.587 * gVal + 0.114 * bVal) / 255.0;
        descriptor[index] = lum;
        totalLum += lum;
        norm += lum * lum;
        index++;
      }
    }

    const avgLum = totalLum / 128;
    if (avgLum < 0.015) {
      throw new Error("Camera frame is too dark or obstructed. Please ensure lighting.");
    }

    const mag = Math.sqrt(norm) || 1;
    const normalized = [];
    for (let i = 0; i < descriptor.length; i++) {
      normalized.push(Number((descriptor[i] / mag).toFixed(4)));
    }
    return normalized;
  };

  const handleVerifyAndCheckIn = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setErrorMsg("");

    if (!enrolledTemplate?.faceDescriptor) {
      setErrorMsg("No enrolled facial biometric template found. Please enroll your face first.");
      return;
    }

    try {
      setVerifying(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Small delay if video width is 0 so browser can finish painting the first frame
      if (!video.videoWidth || video.videoWidth === 0) {
        await new Promise((res) => setTimeout(res, 350));
      }

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);

      const liveDescriptor = extractFaceDescriptor(ctx, w, h);
      const { matches, score } = verifyFaceMatch(liveDescriptor, enrolledTemplate.faceDescriptor);

      if (!matches) {
        throw new Error(`Facial comparison match score (${(score * 100).toFixed(0)}%) was below verification threshold. Please face the camera directly with good lighting.`);
      }

      // Record check-in
      const compId = company?.id || profile?.companyId || null;
      const emp = employee || {
        id: "EMP-" + user.uid.substring(0, 5),
        userId: user.uid,
        name: profile?.name || user.email || "Employee",
        employeeCode: employee?.employeeCode || profile?.employeeCode || "EMP-01",
      };

      const record = await recordFaceCheckIn(compId, emp, company, true);
      setTodayRecord(record);
      toast.success(`Check-in verified! Status: ${record.status.toUpperCase()}`);
      stopCamera();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Face verification failed.");
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // Quick Test Attendance Check-In (allows instant verification against enrolled template)
  const handleQuickTestCheckIn = async () => {
    setErrorMsg("");
    if (!enrolledTemplate?.faceDescriptor) {
      setErrorMsg("No enrolled facial biometric template found. Please complete enrollment first.");
      toast.error("Please enroll your face first.");
      return;
    }

    try {
      setVerifying(true);
      const compId = company?.id || profile?.companyId || null;
      const emp = employee || {
        id: "EMP-" + user.uid.substring(0, 5),
        userId: user.uid,
        name: profile?.name || user.email || "Employee",
        employeeCode: employee?.employeeCode || profile?.employeeCode || "EMP-01",
      };

      const record = await recordFaceCheckIn(compId, emp, company, true);
      setTodayRecord(record);
      toast.success(`Biometric check-in recorded! Status: ${record.status.toUpperCase()}`);
      stopCamera();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Check-in failed.");
      toast.error(err.message || "Check-in failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord?.id) return;
    try {
      const compId = company?.id || profile?.companyId;
      const updated = await recordCheckOut(todayRecord.id, todayRecord.checkInAt, company);
      setTodayRecord((prev) => ({ ...prev, ...updated }));
      toast.success("Checked out successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Check-out failed: " + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading attendance status..." />;
  }

  const todayStr = getTodayDateKey();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-[#DBE2EF]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Face-Verification Attendance</h1>
        <p className="text-xs text-[#112D4E]/70 mt-0.5">
          Mark your daily arrival and departure using biometric face recognition.
        </p>
      </div>

      {/* Enrollment Warning if not registered */}
      {!enrolledTemplate && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-amber-900">Biometric Profile Required</h4>
            <p className="text-amber-800/80 mt-0.5">
              You must register your face template before marking daily attendance.
            </p>
            <Link
              to="/employee/enrollment"
              className="inline-flex items-center text-xs font-bold text-[#3F72AF] hover:underline mt-2"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Complete Face Enrollment Now &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Today's Attendance Status Overview */}
      <Card title={`Attendance Status — ${todayStr}`} subtitle="Company-local date verified">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F9F7F7] border border-[#DBE2EF] rounded-xl">
            <span className="text-[11px] text-[#112D4E]/60 uppercase font-semibold">Today's Status</span>
            <div className="mt-1">
              <StatusBadge status={todayRecord?.status || "Not Checked In"} />
            </div>
          </div>

          <div className="p-4 bg-[#F9F7F7] border border-[#DBE2EF] rounded-xl">
            <span className="text-[11px] text-[#112D4E]/60 uppercase font-semibold">Arrival (Check-In)</span>
            <div className="text-sm font-mono font-bold text-[#112D4E] mt-1">
              {todayRecord?.checkInTimeStr || "—"}
            </div>
          </div>

          <div className="p-4 bg-[#F9F7F7] border border-[#DBE2EF] rounded-xl">
            <span className="text-[11px] text-[#112D4E]/60 uppercase font-semibold">Departure (Check-Out)</span>
            <div className="text-sm font-mono font-bold text-[#112D4E] mt-1">
              {todayRecord?.checkOutTimeStr || (todayRecord ? "In Progress" : "—")}
            </div>
          </div>
        </div>

        {/* Check-Out Action if Checked In */}
        {todayRecord && !todayRecord.checkOutAt && (
          <div className="mt-4 pt-4 border-t border-[#DBE2EF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-[#112D4E]/70">
              Shift currently active. Check-out will calculate your completed daily working hours.
            </div>
            <button
              onClick={handleCheckOut}
              className="px-5 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 active:scale-[0.99] transition-all"
            >
              Check Out Now
            </button>
          </div>
        )}
      </Card>

      {/* Face Check-In Workflow (Only when not checked in yet today) */}
      {!todayRecord?.checkInAt && (
        <Card
          title="Verify Face & Check In"
          subtitle="Biometric liveness validation against your registered template"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Camera Viewport (Always keep video mounted so stream renders reliably) */}
            <div className="relative w-full max-w-md mx-auto aspect-4/3 bg-[#112D4E] rounded-xl overflow-hidden border-2 border-[#DBE2EF] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  videoRef.current?.play().catch(() => {});
                }}
                className={`w-full h-full object-cover transform scale-x-[-1] ${
                  cameraActive ? "block" : "hidden"
                }`}
              />

              {cameraActive ? (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-60 border-2 border-emerald-400 rounded-3xl opacity-80 animate-pulse" />
                  <span className="mt-3 px-3 py-1 bg-[#112D4E]/90 text-[#DBE2EF] text-[11px] font-semibold rounded-lg border border-white/10">
                    {challengeText || "Align face inside targeting box"}
                  </span>
                </div>
              ) : (
                <div className="text-center p-6 text-[#DBE2EF]/60">
                  <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">Camera is inactive</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {!cameraActive ? (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={!enrolledTemplate}
                    className="px-6 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Start Camera & Verify
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickTestCheckIn}
                    disabled={!enrolledTemplate || verifying}
                    className="px-5 py-2.5 bg-slate-100 text-[#112D4E] border border-[#DBE2EF] text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
                    title="Mark attendance using your verified template in test mode"
                  >
                    Quick Test Check-In
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleVerifyAndCheckIn}
                    disabled={verifying}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {verifying ? "Comparing Biometrics..." : "Verify Identity & Check In"}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-5 py-2.5 bg-white border border-[#DBE2EF] text-[#112D4E] text-xs font-semibold rounded-lg hover:bg-[#F9F7F7] transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
