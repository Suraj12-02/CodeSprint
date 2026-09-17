import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { sections } from "../data/challenges";
import { useProgress } from "../hooks/useProgress";
import { useAuth } from "../hooks/useAuth";
import ProgressBar from "./ProgressBar";

export default function Sidebar({ open, onClose }) {
  const { sectionStats, overallStats, resetProgress } = useProgress();
  const { user, logOut } = useAuth();
  const overall = overallStats();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("codesprint-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("codesprint-sidebar-collapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen shrink-0 border-r border-line bg-surface
        flex flex-col transition-all duration-200
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "w-16" : "w-72"}`}
      >
        <div className={`px-5 pt-6 pb-5 border-b border-line flex items-center justify-between`}>
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-2 group" onClick={onClose}>
              <span className="w-2.5 h-2.5 rounded-sm bg-accent group-hover:bg-good transition-colors" />
              <span className="font-mono text-[15px] font-semibold tracking-tight text-text">
                CodeSprint
              </span>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/" className="mx-auto flex items-center justify-center group" onClick={onClose}>
              <span className="w-3 h-3 rounded-sm bg-accent group-hover:bg-good transition-colors" />
            </NavLink>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`text-faint hover:text-text transition-colors ${collapsed ? 'mx-auto mt-4' : ''}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {!collapsed && (
          <div className="px-5 mt-2">
            <p className="text-xs text-muted leading-relaxed">
              Think. Code. Test. Improve.
            </p>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2 py-4 flex flex-col items-center' : 'px-3 py-4 space-y-1'}`}>
          {!collapsed && (
            <p className="px-2 pb-2 text-2xs uppercase tracking-wider text-faint font-mono">
              Sections
            </p>
          )}
          {sections.map((section) => {
            const stats = sectionStats(section.slug);
            return (
              <NavLink
                key={section.slug}
                to={`/section/${section.slug}`}
                onClick={onClose}
                title={collapsed ? section.title : undefined}
                className={({ isActive }) =>
                  `block rounded-md group transition-colors ${collapsed ? 'w-10 h-10 flex items-center justify-center mb-2' : 'px-3 py-2.5'} ${
                    isActive ? "bg-surface2" : "hover:bg-surface2/60"
                  }`
                }
              >
                {collapsed ? (
                  <div
                    className="w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold text-white"
                    style={{ backgroundColor: section.accent || '#5B8DEF' }}
                  >
                    {section.title.charAt(0)}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text font-medium">{section.title}</span>
                      <span className="text-2xs font-mono text-muted">
                        {stats.done}/{stats.total}
                      </span>
                    </div>
                    <ProgressBar pct={stats.pct} color={section.accent} height={4} />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="px-5 py-4 border-t border-line">
          {user ? (
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <p className="text-2xs font-mono text-faint uppercase tracking-wider">Signed in</p>
                <p className="text-[13px] text-text truncate">{user}</p>
              </div>
              <button
                onClick={logOut}
                className="text-2xs font-mono text-faint hover:text-bad transition-colors shrink-0"
              >
                log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <NavLink
                to="/login"
                onClick={onClose}
                className="flex-1 text-center text-2xs font-mono py-1.5 rounded-md border border-line text-muted hover:text-text hover:border-faint transition-colors"
              >
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                onClick={onClose}
                className="flex-1 text-center text-2xs font-mono py-1.5 rounded-md bg-accent hover:bg-accentDim text-white transition-colors"
              >
                Sign up
              </NavLink>
            </div>
          )}

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xs uppercase tracking-wider text-faint font-mono">
              Overall
            </span>
            <span className="text-2xs font-mono text-muted">{overall.pct}%</span>
          </div>
          <ProgressBar pct={overall.pct} />
            <button
              onClick={() => {
                if (confirm("Reset all saved progress? This can't be undone.")) resetProgress();
              }}
              className="mt-4 text-2xs text-faint hover:text-bad transition-colors"
            >
              Reset progress
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
