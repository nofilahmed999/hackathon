import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, query, limit, serverTimestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

let envConfig = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        envConfig[key] = value;
      }
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY || "AIzaSyDZ--dAdMvsRBW45k0FZgt3COeREKb44lY",
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN || "hackathon-eaf70.firebaseapp.com",
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID || "hackathon-eaf70",
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET || "hackathon-eaf70.firebasestorage.app",
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID || "220795298046",
  appId: envConfig.VITE_FIREBASE_APP_ID || "1:220795298046:web:b22d8972ed32995d2cc5af",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || "admin@company.com";
  const password = args[1] || "Admin1234!";
  const name = args[2] || "System Administrator";

  console.log("==========================================");
  console.log("    HCM Lite - Admin Emergency Creator    ");
  console.log("==========================================");
  console.log(`Target Email : ${email}`);
  console.log(`Target Name  : ${name}`);
  console.log(`Password     : ${password.replace(/./g, "*")}`);
  console.log("------------------------------------------");

  try {
    let uid;
    // 1. Try to create the user in Auth
    try {
      console.log("⏳ Attempting to register Firebase Auth credentials...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`✅ Firebase Auth user created! UID: ${uid}`);
    } catch (authErr) {
      if (authErr.code === "auth/email-already-in-use") {
        console.log("ℹ️  User already exists in Firebase Auth. Attempting sign in...");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        console.log(`✅ Signed in as existing user! UID: ${uid}`);
      } else {
        throw authErr;
      }
    }

    // 2. Discover existing company ID if any
    let companyId = null;
    try {
      const compSnap = await getDocs(query(collection(db, "companies"), limit(1)));
      if (!compSnap.empty) {
        companyId = compSnap.docs[0].id;
        console.log(`🏢 Found existing company: ${compSnap.docs[0].data().name} (${companyId})`);
      }
    } catch (compErr) {
      console.warn("Notice checking company:", compErr.message);
    }

    // 3. Write/update user doc in Firestore
    console.log("⏳ Updating Firestore user document with role: 'admin'...");
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid,
      name,
      email,
      role: "admin",
      companyId,
      status: "active",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log("------------------------------------------");
    console.log("🎉 SUCCESS! Administrator account is ready!");
    console.log(`Email    : ${email}`);
    console.log(`Password : ${password}`);
    console.log(`Role     : admin`);
    console.log("You can now sign in at http://localhost:5173/login");
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

main();
