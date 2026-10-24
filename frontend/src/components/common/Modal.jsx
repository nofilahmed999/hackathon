import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#112D4E]/40 backdrop-blur-xs">
      <div 
        className={`bg-white rounded-xl border border-[#DBE2EF] w-full ${maxWidth} overflow-hidden transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4.5 border-b border-[#DBE2EF] flex items-center justify-between bg-[#F9F7F7]">
          <h3 className="text-base font-semibold text-[#112D4E]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#112D4E]/60 hover:text-[#112D4E] hover:bg-[#DBE2EF]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
