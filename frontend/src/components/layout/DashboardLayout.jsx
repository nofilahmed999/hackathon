import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIAssistantPanel from "../common/AIAssistantPanel";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F7F7] flex flex-col md:flex-row">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenAI={() => {
          setAiPanelOpen(true);
          setMobileOpen(false);
        }}
      />
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Topbar
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          onOpenAI={() => setAiPanelOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Slide-in Panel */}
      <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
    </div>
  );
}
