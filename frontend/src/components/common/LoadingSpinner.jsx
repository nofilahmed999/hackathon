import React from "react";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-8 h-8 border-3 border-[#DBE2EF] border-t-[#3F72AF] rounded-full animate-spin" />
      <p className="text-sm text-[#112D4E]/70 font-medium">{message}</p>
    </div>
  );
}
