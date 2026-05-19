import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AIPanel } from "@/components/ai/AIPanel";
import { useAiStore } from "@/stores/ai-store";

export function AppShell() {
  const { open: aiOpen, toggle } = useAiStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    function onResize() { setWindowWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cmd+I global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey && e.key === "i") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const showSidebar = !aiOpen || windowWidth >= 1180;

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden p-6 fade-in"
            style={{ background: "var(--bg-app)" }}
          >
            <Outlet />
          </main>
        </div>

        <div
          style={{
            width: aiOpen ? 360 : 0,
            minWidth: aiOpen ? 360 : 0,
            overflow: "hidden",
            transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
        >
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
