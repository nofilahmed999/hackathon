import React from "react";

export default function StatusBadge({ status }) {
  const norm = (status || "").toLowerCase();

  let styles = "bg-gray-100 text-gray-700 border-gray-200";

  if (norm === "present" || norm === "active" || norm === "approved") {
    styles = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (norm === "late" || norm === "pending") {
    styles = "bg-amber-50 text-amber-800 border-amber-200";
  } else if (norm === "half-day") {
    styles = "bg-orange-50 text-orange-800 border-orange-200";
  } else if (norm === "absent" || norm === "inactive" || norm === "rejected") {
    styles = "bg-rose-50 text-rose-800 border-rose-200";
  } else if (norm === "cancelled") {
    styles = "bg-slate-50 text-slate-600 border-slate-200";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border capitalize ${styles}`}>
      {status || "Unknown"}
    </span>
  );
}
