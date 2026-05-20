import { useState } from "react";
import { TerminalPanel } from "./TerminalPanel";
import { PythonChallengePanel } from "./PythonChallengePanel";
import type { Challenge } from "@/lib/types";

interface Props {
  challenge: Challenge;
  trackId: string;
  moduleId: string;
  alreadyCompleted: boolean;
  onAllPassed: () => void;
}

type Tab = "shell" | "python";

export function ChallengeRightPanel({
  challenge,
  trackId,
  moduleId,
  alreadyCompleted,
  onAllPassed,
}: Props) {
  const isPython = challenge.challengeType === "python";
  const [activeTab, setActiveTab] = useState<Tab>(isPython ? "python" : "shell");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--bg-elevated)",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          flexShrink: 0,
        }}
      >
        {(["shell", "python"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: activeTab === tab ? "var(--accent)" : "var(--text-tertiary)",
              borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "color 0.15s",
            }}
          >
            {tab === "shell" ? "Shell" : "Python"}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: "hidden", padding: activeTab === "python" ? 16 : 0 }}>
        {activeTab === "shell" ? (
          <TerminalPanel active={activeTab === "shell"} />
        ) : (
          <PythonChallengePanel
            challenge={challenge}
            trackId={trackId}
            moduleId={moduleId}
            alreadyCompleted={alreadyCompleted}
            onAllPassed={onAllPassed}
          />
        )}
      </div>
    </div>
  );
}
