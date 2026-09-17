import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import RequireAuth from "./components/RequireAuth";
import Dashboard from "./pages/Dashboard";
import SectionPage from "./pages/SectionPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import ChallengePage from "./pages/ChallengePage";
import LessonPage from "./pages/LessonPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/section/:sectionSlug/:subSlug/lesson"
        element={
          <RequireAuth>
            <LessonPage />
          </RequireAuth>
        }
      />

      <Route
        path="*"
        element={
          <RequireAuth>
            <div className="flex min-h-screen bg-ink">
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

              <div className="flex-1 min-w-0 flex flex-col">
                <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-line bg-ink/95 backdrop-blur">
                  <span className="font-mono text-sm font-semibold text-text">CodeSprint</span>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-muted text-sm border border-line rounded-md px-2.5 py-1"
                    aria-label="Open menu"
                  >
                    menu
                  </button>
                </header>

                <main className="flex-1 min-h-0 flex flex-col">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/section/:sectionSlug" element={<SectionPage />} />
                    <Route path="/section/:sectionSlug/:subSlug" element={<SubcategoryPage />} />
                    <Route path="/section/:sectionSlug/:subSlug/:id" element={<ChallengePage />} />
                  </Routes>
                </main>
              </div>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
