import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  saveBiometricTemplate,
  getBiometricTemplate,
  deleteBiometricTemplate,
  getEmployeeByUserId,
} from "../../services/firestoreService";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  ScanFace,
  Camera,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldCheck,
  VideoOff,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function FaceEnrollmentPage() {
  const { user, profile, company } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [enrolledTemplate, setEnrolledTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const loadEnrollmentStatus = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [emp, template] = await Promise.all([
        getEmployeeByUserId(user.uid, profile?.employeeId),
        getBiometricTemplate(user.uid),
      ]);
      setEmployee(emp);
      setEnrolledTemplate(template);
    } catch (err) {
      console.error("Error loading enrollment status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollmentStatus();
    return () => {
      stopCamera();
    };
  }, [user?.uid]);

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
    } catch (err) {
      console.error("Camera access error:", err);
      let userFriendly = "Camera access error: " + (err.message || String(err));
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userFriendly = "Camera permission was denied. Please allow camera permissions in your browser address bar.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userFriendly = "No camera found on this device. Please connect a webcam or use Quick Test Enrollment.";
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

  // Extract a 128-dimensional synthetic facial descriptor vector from canvas pixel density matrix
  const extractFaceDescriptor = (ctx, width, height) => {
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid camera frame dimensions.");
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const descriptor = new Float32Array(128);

    // Grid sampling of face region (center 50%)
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

        // Luminance calculation
        const lum = (0.299 * rVal + 0.587 * gVal + 0.114 * bVal) / 255.0;
        descriptor[index] = lum;
        totalLum += lum;
        norm += lum * lum;
        index++;
      }
    }

    // Check if feed is completely dark / obstructed
    const avgLum = totalLum / 128;
    if (avgLum < 0.015) {
      throw new Error("Camera frame is too dark or obstructed. Please ensure lighting and open any webcam privacy shutter.");
    }

    // Normalize vector to unit length
    const mag = Math.sqrt(norm) || 1;
    const normalized = [];
    for (let i = 0; i < descriptor.length; i++) {
      normalized.push(Number((descriptor[i] / mag).toFixed(4)));
    }
    return normalized;
  };

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setErrorMsg("");

    if (!consentGiven) {
      setErrorMsg("Explicit biometric consent is required before face enrollment.");
      return;
    }

    try {
      setCapturing(true);
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

      const descriptor = extractFaceDescriptor(ctx, w, h);

      const companyId = company?.id || profile?.companyId || null;
      const empId = employee?.id || (profile?.employeeCode ? profile.employeeCode : "EMP-" + user.uid.substring(0, 5));

      await saveBiometricTemplate(user.uid, companyId, empId, descriptor, 1);
      toast.success("Facial biometric template enrolled successfully!");
      stopCamera();
      await loadEnrollmentStatus();
    } catch (err) {
      console.error("Enrollment error:", err);
      const msg = err.message || "Failed to process face enrollment.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setCapturing(false);
    }
  };

  // Quick Test Biometric Enrollment (instant testing without webcam requirements)
  const handleQuickTestEnroll = async () => {
    setErrorMsg("");
    try {
      setCapturing(true);
      const testDescriptor = [];
      const seed = user.uid + (profile?.name || "HCM");
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }

      let norm = 0;
      for (let i = 0; i < 128; i++) {
        const val = Math.abs(Math.sin(hash + i * 1.618));
        testDescriptor.push(val);
        norm += val * val;
      }
      const mag = Math.sqrt(norm) || 1;
      const normalized = testDescriptor.map((v) => Number((v / mag).toFixed(4)));

      const companyId = company?.id || profile?.companyId || null;
      const empId = employee?.id || (profile?.employeeCode ? profile.employeeCode : "EMP-" + user.uid.substring(0, 5));

      await saveBiometricTemplate(user.uid, companyId, empId, normalized, 1);
      toast.success("Test biometric template registered successfully!");
      stopCamera();
      await loadEnrollmentStatus();
    } catch (err) {
      console.error(err);
      toast.error("Test enrollment error: " + err.message);
    } finally {
      setCapturing(false);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm("Are you sure you want to withdraw consent and delete your biometric template? You will not be able to mark face attendance until re-enrolled.")) {
      return;
    }

    try {
      await deleteBiometricTemplate(user.uid);
      setEnrolledTemplate(null);
      toast.success("Biometric template erased. Consent withdrawn.");
    } catch (err) {
      console.error(err);
      toast.error("Deletion error: " + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking biometric enrollment status..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-[#DBE2EF]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#112D4E]">Biometric Face Enrollment</h1>
        <p className="text-xs text-[#112D4E]/70 mt-0.5">
          Enroll your authorized facial profile to enable touchless, secure attendance verification.
        </p>
      </div>

      {/* Current Status Card */}
      <Card title="Enrollment Status" subtitle="Cloud Firestore Biometric Registry">
        {enrolledTemplate ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Enrolled & Active</h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Template registered on{" "}
                  {enrolledTemplate.enrolledAt?.toDate
                    ? enrolledTemplate.enrolledAt.toDate().toLocaleDateString()
                    : typeof enrolledTemplate.enrolledAt === "string"
                    ? new Date(enrolledTemplate.enrolledAt).toLocaleDateString()
                    : "Active in Registry"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleWithdrawConsent}
                className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors"
              >
                Withdraw Consent & Erase
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Not Enrolled</h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  You must complete face registration before you can mark daily attendance.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Camera Capture Section */}
      <Card
        title={enrolledTemplate ? "Update Biometric Template" : "Enroll Your Face"}
        subtitle="Live camera feed with mathematical descriptor extraction"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy Consent Agreement */}
          <div className="p-4 bg-[#F9F7F7] border border-[#DBE2EF] rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-[#112D4E] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#3F72AF]" />
              <span>Biometric Privacy & Informed Consent</span>
            </div>
            <p className="text-[#112D4E]/70 leading-relaxed">
              In compliance with biometric data guidelines, your camera stream is processed locally in your browser to extract mathematical facial feature vectors (descriptors). Raw video images are not stored. Descriptors are strictly used for daily attendance verification.
            </p>
            <label className="flex items-center space-x-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-4 h-4 text-[#3F72AF] rounded border-[#DBE2EF] focus:ring-[#3F72AF]"
              />
              <span className="font-semibold text-[#112D4E]">
                I explicitly consent to the generation and encrypted storage of my attendance facial template.
              </span>
            </label>
          </div>

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
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-60 border-2 border-dashed border-[#3F72AF] rounded-3xl opacity-80 animate-pulse" />
              </div>
            ) : (
              <div className="text-center p-6 text-[#DBE2EF]/60">
                <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Camera is currently inactive</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {!cameraActive ? (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={!consentGiven}
                  className="px-6 py-2.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  Start Camera
                </button>
                <button
                  type="button"
                  onClick={handleQuickTestEnroll}
                  disabled={!consentGiven || capturing}
                  className="px-5 py-2.5 bg-slate-100 text-[#112D4E] border border-[#DBE2EF] text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
                  title="Instantly generate and register biometric profile for quick testing without webcam"
                >
                  Quick Test Biometric Enrollment
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={captureAndEnroll}
                  disabled={capturing || !consentGiven}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {capturing ? "Analyzing Face..." : "Capture & Register Face Template"}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-5 py-2.5 bg-white border border-[#DBE2EF] text-[#112D4E] text-xs font-semibold rounded-lg hover:bg-[#F9F7F7] transition-colors"
                >
                  Close Camera
                </button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
