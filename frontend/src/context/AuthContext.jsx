import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserProfile, getCompany } from "../services/firestoreService";
import { useDispatch } from "react-redux";
import { setProfile as setReduxProfile, clearProfile as clearReduxProfile } from "../store/slices/authSlice";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const fetchUserData = async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setCompany(null);
      dispatch(clearReduxProfile());
      return;
    }

    setUser(currentUser);
    try {
      const userDoc = await getUserProfile(currentUser.uid);
      if (userDoc) {
        setProfile(userDoc);
        dispatch(setReduxProfile(userDoc));

        if (userDoc.companyId) {
          const compDoc = await getCompany(userDoc.companyId);
          setCompany(compDoc);
        } else {
          setCompany(null);
        }
      } else {
        // Fallback profile if Firestore doc hasn't been written yet
        const defaultProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          role: "employee",
        };
        setProfile(defaultProfile);
        dispatch(setReduxProfile(defaultProfile));
        setCompany(null);
      }
    } catch (err) {
      console.error("AuthContext fetchUserData error:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      await fetchUserData(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setCompany(null);
    dispatch(clearReduxProfile());
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    profile,
    company,
    loading,
    login,
    logout,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
