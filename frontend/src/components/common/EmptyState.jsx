import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({ title, description, actionText, onAction, icon: Icon = FolderOpen }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#DBE2EF] rounded-lg text-center my-4">
      <div className="w-12 h-12 rounded-full bg-[#F9F7F7] border border-[#DBE2EF] flex items-center justify-center text-[#3F72AF] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#112D4E]">{title}</h3>
      {description && <p className="text-sm text-[#112D4E]/70 max-w-sm mt-1">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#3F72AF] text-white text-sm font-medium rounded hover:bg-[#112D4E] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
