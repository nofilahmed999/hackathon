import React from "react";

export default function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`bg-white border border-[#DBE2EF] rounded-xl overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-[#DBE2EF] flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-[#112D4E]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#112D4E]/70 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
