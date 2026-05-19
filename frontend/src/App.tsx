import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import ModuleView from "@/pages/ModuleView";
import LessonView from "@/pages/LessonView";
import ChallengeView from "@/pages/ChallengeView";
import ExamplesView from "@/pages/ExamplesView";
import ExampleDetail from "@/pages/ExampleDetail";
import Settings from "@/pages/Settings";
import LoginPage from "@/pages/LoginPage";
import { useThemeStore } from "@/stores/theme-store";
import { useTrackStore } from "@/stores/track-store";
import { useAuthStore } from "@/stores/auth-store";

function TrackRedirect() {
  const { activeTrackId, initialized } = useTrackStore();
  if (!initialized) return null;
  return <Navigate to={`/${activeTrackId}`} replace />;
}

export default function App() {
  const { theme } = useThemeStore();
  const { initialize: initTrack } = useTrackStore();
  const { isAuthenticated, initialize: initAuth } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) void initTrack();
  }, [isAuthenticated, initTrack]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrackRedirect />} />
        <Route element={<AppShell />}>
          {/* /settings must be listed before /:trackId so static path wins */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/:trackId" element={<Dashboard />} />
          <Route path="/:trackId/module/:moduleId" element={<ModuleView />} />
          <Route
            path="/:trackId/module/:moduleId/lesson/:lessonId"
            element={<LessonView />}
          />
          <Route
            path="/:trackId/module/:moduleId/challenge/:challengeId"
            element={<ChallengeView />}
          />
          <Route path="/:trackId/examples" element={<ExamplesView />} />
          <Route path="/:trackId/examples/:exampleId" element={<ExampleDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
