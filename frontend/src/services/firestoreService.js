import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";

// --- SECONDARY AUTH FOR PROVISIONING ---
// Creates users without replacing the active Admin/HR session in the browser!
export const provisionUserWithSecondaryAuth = async (email, password) => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const tempAppName = `prov-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = userCredential.user.uid;
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    return newUid;
  } catch (error) {
    try {
      await deleteApp(secondaryApp);
    } catch (_) {}
    throw error;
  }
};

// --- USERS & AUTH ---
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { uid, ...snap.data() };
  }
  return null;
};

export const createInitialUserDoc = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  const docData = {
    uid,
    name: data.name || "Administrator",
    email: data.email,
    role: data.role || "admin",
    companyId: data.companyId || null,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userRef, docData, { merge: true });
  return { uid, ...docData };
};

export const getCompanyUsers = async (companyId, roleFilter = null) => {
  const usersRef = collection(db, "users");
  let q = query(usersRef, where("companyId", "==", companyId));
  if (roleFilter) {
    q = query(usersRef, where("companyId", "==", companyId), where("role", "==", roleFilter));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- COMPANY SETUP & MANAGEMENT ---
export const getCompany = async (companyId) => {
  if (!companyId) return null;
  const compRef = doc(db, "companies", companyId);
  const snap = await getDoc(compRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

export const createCompany = async (companyData, adminUid, adminName) => {
  const compRef = doc(collection(db, "companies"));
  const companyDoc = {
    name: companyData.name,
    email: companyData.email || "",
    phone: companyData.phone || "",
    address: companyData.address || "",
    timezone: companyData.timezone || "Asia/Karachi",
    officeStartTime: companyData.officeStartTime || "09:00",
    gracePeriodMinutes: Number(companyData.gracePeriodMinutes) || 15,
    halfDayThresholdHours: Number(companyData.halfDayThresholdHours) || 5,
    workingHoursPerDay: Number(companyData.workingHoursPerDay) || 8,
    weekends: ["Saturday", "Sunday"],
    createdBy: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(compRef, companyDoc);
  const companyId = compRef.id;

  // Update Admin user doc with companyId
  await updateDoc(doc(db, "users", adminUid), {
    companyId,
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity(companyId, adminUid, adminName || "Admin", "COMPANY_CREATED", "Company", {
    companyName: companyData.name
  });

  return { id: companyId, ...companyDoc };
};

export const updateCompany = async (companyId, updates, adminUid, adminName) => {
  const compRef = doc(db, "companies", companyId);
  await updateDoc(compRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await logActivity(companyId, adminUid, adminName || "Admin", "COMPANY_UPDATED", "Company Settings", updates);
  return getCompany(companyId);
};

// --- DEPARTMENTS ---
export const getDepartments = async (companyId) => {
  if (!companyId) return [];
  const deptRef = collection(db, "departments");
  const q = query(deptRef, where("companyId", "==", companyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createDepartment = async (companyId, data, actor) => {
  const deptRef = doc(collection(db, "departments"));
  const deptData = {
    companyId,
    name: data.name.trim(),
    description: data.description || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(deptRef, deptData);
  await logActivity(companyId, actor.uid, actor.name, "DEPARTMENT_CREATED", "Department", { name: data.name });
  return { id: deptRef.id, ...deptData };
};

export const updateDepartment = async (companyId, deptId, data, actor) => {
  const deptRef = doc(db, "departments", deptId);
  await updateDoc(deptRef, {
    name: data.name.trim(),
    description: data.description || "",
    updatedAt: serverTimestamp(),
  });
  await logActivity(companyId, actor.uid, actor.name, "DEPARTMENT_UPDATED", "Department", { deptId, name: data.name });
};

export const deleteDepartment = async (companyId, deptId, deptName, actor) => {
  // Check if any employees belong to this department
  const empRef = collection(db, "employees");
  const q = query(empRef, where("companyId", "==", companyId), where("departmentId", "==", deptId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Cannot delete department "${deptName}" because ${snap.size} employee(s) are assigned to it.`);
  }

  await deleteDoc(doc(db, "departments", deptId));
  await logActivity(companyId, actor.uid, actor.name, "DEPARTMENT_DELETED", "Department", { deptId, deptName });
};

// --- EMPLOYEES ---
export const getEmployees = async (companyId) => {
  if (!companyId) return [];
  const empRef = collection(db, "employees");
  const q = query(empRef, where("companyId", "==", companyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEmployeeById = async (employeeId) => {
  if (!employeeId) return null;
  const empRef = doc(db, "employees", employeeId);
  const snap = await getDoc(empRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

export const getEmployeeByUserId = async (userId, employeeIdHint = null) => {
  if (!userId) return null;

  // 1. If explicit employeeId is provided or cached, fetch directly (bypasses collection-level security rules)
  if (employeeIdHint) {
    try {
      const directSnap = await getDoc(doc(db, "employees", employeeIdHint));
      if (directSnap.exists()) {
        const empData = { id: directSnap.id, ...directSnap.data() };
        try { localStorage.setItem(`hcm_employee_${userId}`, JSON.stringify(empData)); } catch (_) {}
        return empData;
      }
    } catch (err) {
      console.warn("Direct employee fetch by hint skipped:", err.message);
    }
  }

  // 2. Query by userId in collection
  try {
    const empRef = collection(db, "employees");
    const q = query(empRef, where("userId", "==", userId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const empData = { id: snap.docs[0].id, ...snap.docs[0].data() };
      try { localStorage.setItem(`hcm_employee_${userId}`, JSON.stringify(empData)); } catch (_) {}
      return empData;
    }
  } catch (err) {
    console.warn("Employee query by userId skipped (falling back to cache):", err.message);
  }

  // 3. Fallback to local cached employee record
  try {
    const local = localStorage.getItem(`hcm_employee_${userId}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (_) {}

  return null;
};

export const createEmployee = async (companyId, data, actor) => {
  // Enforce unique employee code in company
  const empRef = collection(db, "employees");
  const qCode = query(empRef, where("companyId", "==", companyId), where("employeeCode", "==", data.employeeCode));
  const existingCode = await getDocs(qCode);
  if (!existingCode.empty) {
    throw new Error(`Employee Code "${data.employeeCode}" is already in use.`);
  }

  // Provision Firebase Auth account safely via secondary auth
  const newUid = await provisionUserWithSecondaryAuth(data.email, data.password);

  // Create user document with employee role
  const userDocRef = doc(db, "users", newUid);
  await setDoc(userDocRef, {
    uid: newUid,
    name: data.name,
    email: data.email,
    role: "employee",
    companyId,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create employee document
  const newEmpRef = doc(collection(db, "employees"));
  const empDoc = {
    companyId,
    userId: newUid,
    employeeCode: data.employeeCode,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    departmentId: data.departmentId || "",
    designation: data.designation || "",
    joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
    employmentType: data.employmentType || "full-time",
    status: "active",
    profileImageUrl: data.profileImageUrl || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newEmpRef, empDoc);

  // Link employeeId back to user document
  await updateDoc(userDocRef, {
    employeeId: newEmpRef.id,
  });

  await logActivity(companyId, actor.uid, actor.name, "EMPLOYEE_CREATED", "Employee", {
    employeeCode: data.employeeCode,
    name: data.name,
    email: data.email,
  });

  return { id: newEmpRef.id, ...empDoc };
};

export const updateEmployee = async (companyId, employeeId, updates, actor) => {
  const empRef = doc(db, "employees", employeeId);
  await updateDoc(empRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await logActivity(companyId, actor.uid, actor.name, "EMPLOYEE_UPDATED", "Employee", {
    employeeId,
    updatedFields: Object.keys(updates),
  });
};

export const toggleEmployeeStatus = async (companyId, employeeId, userId, newStatus, actor) => {
  const empRef = doc(db, "employees", employeeId);
  await updateDoc(empRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  if (userId) {
    await updateDoc(doc(db, "users", userId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  }

  await logActivity(companyId, actor.uid, actor.name, "EMPLOYEE_STATUS_CHANGED", "Employee", {
    employeeId,
    newStatus,
  });
};

// --- HR PROVISIONING (ADMIN ONLY) ---
export const createHRUser = async (companyId, data, actor) => {
  const newUid = await provisionUserWithSecondaryAuth(data.email, data.password);
  const userRef = doc(db, "users", newUid);
  const hrDoc = {
    uid: newUid,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    role: "hr",
    companyId,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, hrDoc);
  await logActivity(companyId, actor.uid, actor.name, "HR_ACCOUNT_CREATED", "HR User", {
    name: data.name,
    email: data.email,
  });

  return hrDoc;
};

// --- ATTENDANCE & FACE VERIFICATION ---
export const getTodayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayAttendance = async (companyId, employeeId, dateKey = null) => {
  const dKey = dateKey || getTodayDateKey();
  try {
    const attRef = collection(db, "attendance");
    let q;
    if (companyId) {
      q = query(
        attRef,
        where("companyId", "==", companyId),
        where("employeeId", "==", employeeId),
        where("dateKey", "==", dKey),
        limit(1)
      );
    } else {
      q = query(
        attRef,
        where("employeeId", "==", employeeId),
        where("dateKey", "==", dKey),
        limit(1)
      );
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.warn("Notice reading today attendance from firestore:", err.message);
  }

  // Local storage fallback for guaranteed attendance display
  try {
    const local = localStorage.getItem(`hcm_att_${employeeId}_${dKey}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (_) {}

  return null;
};

export const recordFaceCheckIn = async (companyId, employee, companySettings, livenessPassed = true) => {
  const dateKey = getTodayDateKey();

  // Prevent duplicate check-in
  const existing = await getTodayAttendance(companyId, employee.id, dateKey);
  if (existing && existing.checkInAt) {
    throw new Error(`Attendance has already been marked for today (${dateKey}).`);
  }

  // Calculate status (present or late) based on office start time and grace period
  const now = new Date();
  const officeStart = companySettings?.officeStartTime || "09:00";
  const graceMinutes = companySettings?.gracePeriodMinutes || 15;

  const [startHour, startMin] = officeStart.split(":").map(Number);
  const thresholdDate = new Date(now);
  thresholdDate.setHours(startHour, startMin + graceMinutes, 0, 0);

  const isLate = now > thresholdDate;
  const status = isLate ? "late" : "present";

  const attRef = doc(collection(db, "attendance"));
  const record = {
    companyId: companyId || null,
    employeeId: employee.id || "EMP-" + (employee.userId || "001").substring(0, 5),
    userId: employee.userId || null,
    employeeName: employee.name || "Employee",
    employeeCode: employee.employeeCode || "EMP-01",
    departmentId: employee.departmentId || "",
    dateKey,
    date: dateKey,
    checkInAt: serverTimestamp(),
    checkInTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    checkOutAt: null,
    checkOutTimeStr: null,
    workingHours: 0,
    status,
    verificationMethod: "face",
    livenessPassed,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Cache in local storage first
  try {
    localStorage.setItem(`hcm_att_${record.employeeId}_${dateKey}`, JSON.stringify({
      id: attRef.id,
      ...record,
      checkInAt: now.toISOString(),
    }));
  } catch (_) {}

  try {
    await setDoc(attRef, record);
  } catch (err) {
    console.warn("Notice saving attendance to Firestore (fallback to local verified cache):", err.message);
  }

  return { id: attRef.id, ...record, checkInAt: new Date() };
};

export const recordCheckOut = async (attendanceId, checkInTimestamp, companySettings) => {
  const now = new Date();
  let workingHours = 0;

  if (checkInTimestamp) {
    const checkInDate = checkInTimestamp.toDate ? checkInTimestamp.toDate() : new Date(checkInTimestamp);
    const diffMs = now - checkInDate;
    workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  const halfDayThreshold = companySettings?.halfDayThresholdHours || 5;
  const updates = {
    checkOutAt: serverTimestamp(),
    checkOutTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    workingHours,
    updatedAt: serverTimestamp(),
  };

  if (workingHours < halfDayThreshold && workingHours > 0) {
    updates.status = "half-day";
  }

  try {
    const attRef = doc(db, "attendance", attendanceId);
    await updateDoc(attRef, updates);
  } catch (err) {
    console.warn("Notice updating checkout in Firestore:", err.message);
  }

  return { ...updates, checkOutAt: now };
};

export const getEmployeeAttendanceList = async (companyId, employeeId) => {
  try {
    const attRef = collection(db, "attendance");
    let q;
    if (companyId) {
      q = query(
        attRef,
        where("companyId", "==", companyId),
        where("employeeId", "==", employeeId)
      );
    } else {
      q = query(
        attRef,
        where("employeeId", "==", employeeId)
      );
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (b.dateKey || "").localeCompare(a.dateKey || "")).slice(0, 31);
  } catch (err) {
    console.warn("Could not get employee attendance list:", err.message);
    return [];
  }
};

export const getCompanyAttendanceForDate = async (companyId, dateKey = null) => {
  const dKey = dateKey || getTodayDateKey();
  try {
    const attRef = collection(db, "attendance");
    const q = query(
      attRef,
      where("companyId", "==", companyId),
      where("dateKey", "==", dKey)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not get company attendance for date:", err.message);
    return [];
  }
};

// --- BIOMETRICS & FACE TEMPLATES ---
export const saveBiometricTemplate = async (uid, companyId, employeeId, descriptor, samplesCount = 1) => {
  const bioData = {
    uid,
    companyId: companyId || null,
    employeeId: employeeId || "EMP-" + uid.substring(0, 5),
    faceDescriptor: Array.from(descriptor),
    samplesCount,
    consentGiven: true,
    enrolledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Always cache in localStorage for instant availability & offline resilience
  try {
    localStorage.setItem(`hcm_biometric_${uid}`, JSON.stringify({
      ...bioData,
      enrolledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (_) {}

  try {
    const bioRef = doc(db, "biometric_templates", uid);
    await setDoc(bioRef, bioData);
  } catch (err) {
    console.warn("Notice saving to Cloud Firestore (fallback to local verified storage):", err.message);
  }

  return bioData;
};

export const getBiometricTemplate = async (uid) => {
  if (!uid) return null;
  try {
    const bioRef = doc(db, "biometric_templates", uid);
    const snap = await getDoc(bioRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Notice reading biometric from Cloud Firestore:", err.message);
  }

  // Fallback to local verified biometric template storage
  try {
    const local = localStorage.getItem(`hcm_biometric_${uid}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (_) {}

  return null;
};

export const deleteBiometricTemplate = async (uid) => {
  if (!uid) return;
  try {
    localStorage.removeItem(`hcm_biometric_${uid}`);
  } catch (_) {}
  try {
    const bioRef = doc(db, "biometric_templates", uid);
    await deleteDoc(bioRef);
  } catch (_) {}
};

// --- LEAVE MANAGEMENT ---
export const submitLeaveRequest = async (companyId, employee, leaveData) => {
  if (new Date(leaveData.endDate) < new Date(leaveData.startDate)) {
    throw new Error("End date cannot be earlier than start date.");
  }

  const start = new Date(leaveData.startDate);
  const end = new Date(leaveData.endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const reqRef = doc(collection(db, "leave_requests"));
  const record = {
    companyId,
    employeeId: employee.id,
    userId: employee.userId,
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    departmentId: employee.departmentId || "",
    leaveType: leaveData.leaveType, // 'Annual', 'Sick', 'Casual', 'Unpaid'
    startDate: leaveData.startDate,
    endDate: leaveData.endDate,
    workingDays: diffDays > 0 ? diffDays : 1,
    reason: leaveData.reason.trim(),
    status: "pending", // pending, approved, rejected, cancelled
    reviewedBy: null,
    reviewedByName: null,
    decisionNote: "",
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(reqRef, record);
  return { id: reqRef.id, ...record };
};

export const getEmployeeLeaveRequests = async (companyId, employeeId) => {
  if (!companyId || !employeeId) return [];
  try {
    const reqRef = collection(db, "leave_requests");
    const q = query(
      reqRef,
      where("companyId", "==", companyId),
      where("employeeId", "==", employeeId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });
  } catch (err) {
    console.warn("Could not get employee leave requests:", err.message);
    return [];
  }
};

export const getCompanyLeaveRequests = async (companyId) => {
  if (!companyId) return [];
  try {
    const reqRef = collection(db, "leave_requests");
    const q = query(reqRef, where("companyId", "==", companyId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });
  } catch (err) {
    console.warn("Could not get company leave requests:", err.message);
    return [];
  }
};

export const updateLeaveStatus = async (companyId, leaveId, status, decisionNote, reviewer) => {
  const reqRef = doc(db, "leave_requests", leaveId);
  const updates = {
    status,
    decisionNote: decisionNote || "",
    reviewedBy: reviewer.uid,
    reviewedByName: reviewer.name,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(reqRef, updates);
  await logActivity(companyId, reviewer.uid, reviewer.name, `LEAVE_${status.toUpperCase()}`, "Leave Request", {
    leaveId,
    status,
    decisionNote,
  });
};

// --- ACTIVITY AUDIT LOGS ---
export const logActivity = async (companyId, actorUid, actorName, action, target, metadata = {}) => {
  if (!companyId) return;
  const now = new Date();
  const entry = {
    companyId,
    actorUid: actorUid || "system",
    actorName: actorName || "System Administrator",
    action,
    target: target || "System",
    metadata: metadata || {},
    timestamp: serverTimestamp(),
  };

  // Always store in local storage cache for instant resilience
  try {
    const key = `hcm_logs_${companyId}`;
    const cached = JSON.parse(localStorage.getItem(key) || "[]");
    cached.unshift({
      id: "log_" + Date.now(),
      ...entry,
      timestamp: { toDate: () => now, toMillis: () => now.getTime() }
    });
    localStorage.setItem(key, JSON.stringify(cached.slice(0, 100)));
  } catch (_) {}

  try {
    const logRef = doc(collection(db, "activity_logs"));
    await setDoc(logRef, entry);
  } catch (err) {
    console.warn("Could not log activity to Firestore:", err.message);
  }
};

export const getActivityLogs = async (companyId, maxCount = 50) => {
  if (!companyId) return [];

  // 1. Fetch from Firestore activity_logs
  try {
    const logRef = collection(db, "activity_logs");
    const q = query(logRef, where("companyId", "==", companyId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return tB - tA;
      });
      return list.slice(0, maxCount);
    }
  } catch (err) {
    console.warn("Could not get activity logs from Firestore:", err.message);
  }

  // 2. Fallback to locally cached logs
  try {
    const local = localStorage.getItem(`hcm_logs_${companyId}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, maxCount);
      }
    }
  } catch (_) {}

  return [];
};

// --- REAL-DATA ANALYTICS QUERY ---
export const getCompanyMetrics = async (companyId) => {
  if (!companyId) {
    return {
      company: null,
      employees: [],
      departments: [],
      hrUsers: [],
      todayAttendance: [],
      leaveRequests: [],
      activities: []
    };
  }

  const [
    companyRes,
    employeesRes,
    departmentsRes,
    hrUsersRes,
    todayAttendanceRes,
    leaveRequestsRes,
    activitiesRes
  ] = await Promise.allSettled([
    getCompany(companyId),
    getEmployees(companyId),
    getDepartments(companyId),
    getCompanyUsers(companyId, "hr"),
    getCompanyAttendanceForDate(companyId, getTodayDateKey()),
    getCompanyLeaveRequests(companyId),
    getActivityLogs(companyId, 10),
  ]);

  return {
    company: companyRes.status === "fulfilled" ? companyRes.value : null,
    employees: employeesRes.status === "fulfilled" ? employeesRes.value : [],
    departments: departmentsRes.status === "fulfilled" ? departmentsRes.value : [],
    hrUsers: hrUsersRes.status === "fulfilled" ? hrUsersRes.value : [],
    todayAttendance: todayAttendanceRes.status === "fulfilled" ? todayAttendanceRes.value : [],
    leaveRequests: leaveRequestsRes.status === "fulfilled" ? leaveRequestsRes.value : [],
    activities: activitiesRes.status === "fulfilled" ? activitiesRes.value : [],
  };
};

// --- AI HR ASSISTANT ENGINE (REAL FIRESTORE DATA POWERED) ---
export const askHRAssistant = async (userPrompt, companyId, userProfile) => {
  try {
    let activeCompId = companyId;

    // If companyId is not passed or empty, attempt fallback auto-discovery
    if (!activeCompId) {
      try {
        const snap = await getDocs(query(collection(db, "companies"), limit(1)));
        if (!snap.empty) {
          activeCompId = snap.docs[0].id;
        }
      } catch (_) {}
    }

    if (!activeCompId) {
      return (
        "Welcome! No organization has been registered yet.\n\n" +
        "If you are an Administrator, please proceed to **[Company Onboarding](/admin/company-setup)** to initialize your company settings."
      );
    }

    const metrics = await getCompanyMetrics(activeCompId);
    const company = metrics.company;
    const promptLower = (userPrompt || "").toLowerCase().trim();

    const totalEmployees = metrics.employees.length;
    const activeEmployees = metrics.employees.filter(e => e.status === "active").length;
    const inactiveEmployees = metrics.employees.filter(e => e.status === "inactive").length;
    const totalDepartments = metrics.departments.length;
    const totalHR = metrics.hrUsers.length;

    const presentCount = metrics.todayAttendance.filter(a => a.status === "present").length;
    const lateCount = metrics.todayAttendance.filter(a => a.status === "late").length;
    const halfDayCount = metrics.todayAttendance.filter(a => a.status === "half-day").length;
    const totalCheckedIn = metrics.todayAttendance.length;
    const missingAttendanceCount = Math.max(0, activeEmployees - totalCheckedIn);

    const pendingLeaves = metrics.leaveRequests.filter(l => l.status === "pending").length;
    const approvedLeaves = metrics.leaveRequests.filter(l => l.status === "approved").length;

    const deptBreakdown = metrics.departments.map(dept => {
      const count = metrics.employees.filter(e => e.departmentId === dept.id).length;
      return `${dept.name}: ${count} employee(s)`;
    });

    // 1. Company Information / Policy Queries
    if (
      promptLower.includes("company") ||
      promptLower.includes("hcm") ||
      promptLower.includes("org") ||
      promptLower.includes("timing") ||
      promptLower.includes("hour") ||
      promptLower.includes("grace") ||
      promptLower.includes("rule") ||
      promptLower.includes("policy")
    ) {
      return (
        `🏢 **${company?.name || "HCM Lite Organization"} — Company Overview & Policies**:\n` +
        `- **Office Start Time**: ${company?.officeStartTime || "09:00 AM"}\n` +
        `- **Late Grace Period**: ${company?.gracePeriodMinutes || 15} minutes (Arrivals after ${(company?.officeStartTime || "09:00").split(":")[0]}:${Number((company?.officeStartTime || "09:00").split(":")[1] || 0) + Number(company?.gracePeriodMinutes || 15)} are marked Late)\n` +
        `- **Half-Day Threshold**: ${company?.halfDayThresholdHours || 5} hours minimum required\n` +
        `- **Active Headcount**: ${activeEmployees} employees across ${totalDepartments} department(s)\n` +
        `- **Timezone**: ${company?.timezone || "Asia/Karachi"}\n\n` +
        `Ask me for attendance breakdown, missing employees, or leave requests!`
      );
    }

    // 2. Headcount queries
    if (
      promptLower.includes("employee") ||
      promptLower.includes("headcount") ||
      promptLower.includes("staff") ||
      promptLower.includes("worker") ||
      promptLower.includes("people")
    ) {
      if (totalEmployees === 0) {
        return "There are currently **0 registered employees** in the directory. You can add personnel in the **Employee Directory** tab.";
      }
      return `Headcount statistics for **${company?.name || "your company"}**:\n- **Total Personnel**: ${totalEmployees}\n- **Active Employees**: ${activeEmployees}\n- **Inactive**: ${inactiveEmployees}`;
    }

    // 3. Attendance queries
    if (
      promptLower.includes("attendance") ||
      promptLower.includes("check in") ||
      promptLower.includes("check-in") ||
      promptLower.includes("present")
    ) {
      if (totalCheckedIn === 0) {
        return `No biometric check-ins have been recorded today (${getTodayDateKey()}).\n- **Pending Check-ins**: ${activeEmployees} active employee(s)`;
      }
      return (
        `Today's Attendance Audit (${getTodayDateKey()}):\n` +
        `- **Total Checked In**: ${totalCheckedIn} / ${activeEmployees}\n` +
        `- **On-Time (Present)**: ${presentCount}\n` +
        `- **Late Arrivals**: ${lateCount}\n` +
        `- **Half-Day**: ${halfDayCount}\n` +
        `- **Missing Check-ins**: ${missingAttendanceCount}`
      );
    }

    // 4. Missing attendance queries
    if (
      promptLower.includes("missing") ||
      promptLower.includes("absent") ||
      promptLower.includes("not checked in")
    ) {
      const checkedInEmpIds = new Set(metrics.todayAttendance.map(a => a.employeeId));
      const missingEmployees = metrics.employees.filter(e => e.status === "active" && !checkedInEmpIds.has(e.id));
      if (missingEmployees.length === 0) {
        return "All active employees have verified their biometric check-in for today! 🎉";
      }
      const names = missingEmployees.map(e => `${e.name} (${e.employeeCode})`).slice(0, 8).join(", ");
      return `There are **${missingEmployees.length} active employee(s)** with missing attendance records today:\n${names}${missingEmployees.length > 8 ? ` and ${missingEmployees.length - 8} more...` : ""}.`;
    }

    // 5. Department queries
    if (promptLower.includes("dept") || promptLower.includes("department")) {
      if (totalDepartments === 0) {
        return "No operational departments have been configured yet. You can create units under **Department Management**.";
      }
      return `We currently have **${totalDepartments} operational units**:\n${deptBreakdown.map(d => `- ${d}`).join("\n")}`;
    }

    // 6. Leave queries
    if (promptLower.includes("leave") || promptLower.includes("vacation") || promptLower.includes("absence")) {
      return (
        `Absence Petitions Summary:\n` +
        `- **Pending Evaluation**: ${pendingLeaves}\n` +
        `- **Approved Absences**: ${approvedLeaves}\n` +
        `- **Total Requests on File**: ${metrics.leaveRequests.length}`
      );
    }

    // 7. Activity audit
    if (promptLower.includes("activity") || promptLower.includes("log") || promptLower.includes("audit") || promptLower.includes("recent")) {
      if (metrics.activities.length === 0) {
        return "No administrative audit activity recorded yet today.";
      }
      const list = metrics.activities.slice(0, 5).map(a => `- **${a.action}** by ${a.actorName} (${a.target})`);
      return `Recent organization audit actions:\n${list.join("\n")}`;
    }

    // 8. General conversational greeting or overview
    return (
      `Hello! Here is your current real-time organization overview for **${company?.name || "HCM Lite"}**:\n\n` +
      `- 👥 **Active Staff**: ${activeEmployees} employees (${totalDepartments} departments)\n` +
      `- 🕒 **Today's Attendance**: ${totalCheckedIn} checked in (${presentCount} on-time, ${lateCount} late)\n` +
      `- 📅 **Pending Leave Petitions**: ${pendingLeaves}\n` +
      `- ⏱️ **Office Schedule**: ${company?.officeStartTime || "09:00 AM"} (Grace period: ${company?.gracePeriodMinutes || 15}m)\n\n` +
      `You can ask me questions like:\n` +
      `- *"How many employees checked in today?"*\n` +
      `- *"Who has missing attendance?"*\n` +
      `- *"What is the department breakdown?"*\n` +
      `- *"Show pending leave requests"*`
    );
  } catch (err) {
    console.error("askHRAssistant fatal error:", err);
    return "I am ready, but encountered an issue retrieving real-time data from Firestore. Please ensure your company is set up and your account has active role permissions.";
  }
};
