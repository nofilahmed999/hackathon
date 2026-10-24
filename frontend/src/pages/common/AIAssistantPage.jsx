import React from "react";
import { Sparkles } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#3F72AF]/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-[#3F72AF]" />
      </div>
      <h2 className="text-lg font-bold text-[#112D4E]">AI HR Assistant</h2>
      <p className="text-sm text-[#112D4E]/60 mt-2 max-w-sm">
        Click the <strong>"AI Assistant"</strong> button in the top navigation bar to open the
        assistant panel on the right side of your screen.
      </p>
    </div>
  );
}
