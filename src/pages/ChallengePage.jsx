import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getSection, getSubcategory, getChallenge } from "../data/challenges";
import { runChallenge, formatArgs } from "../lib/runner";
import { useProgress } from "../hooks/useProgress";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { vim } from "@replit/codemirror-vim";
import { EditorView } from "@codemirror/view";
import { Compartment } from "@codemirror/state";

const fontCompartment = new Compartment();

const buildFontTheme = (fontFamily, fontSize, fontLigatures) =>
  EditorView.theme({
    "&": {
      fontSize: `${fontSize}px !important`,
    },
    ".cm-content, .cm-gutters": {
      fontFamily: `"${fontFamily}", ui-monospace, SFMono-Regular, monospace !important`,
      fontSize: `${fontSize}px !important`,
      fontFeatureSettings: fontLigatures ? '"calt" 1, "liga" 1' : 'normal',
      fontVariantLigatures: fontLigatures ? 'normal' : 'none',
    },
  });

const difficultyColor = {
  Easy: "text-good",
  Medium: "text-warn",
  Hard: "text-bad",
};

export default function ChallengePage() {
  const { sectionSlug, subSlug, id } = useParams();
  const navigate = useNavigate();
  const { isComplete, markComplete } = useProgress();

  const section = getSection(sectionSlug);
  const sub = getSubcategory(sectionSlug, subSlug);
  const challenge = getChallenge(sectionSlug, subSlug, id);

  const [code, setCode] = useState(challenge?.starter ?? "");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const terminalRef = useRef(null);
  const [vimMode, setVimMode] = useState(() => {
    return localStorage.getItem("codesprint-vim-mode") === "true";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem("codesprint-font-size") || "14", 10);
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem("codesprint-font-family") || "JetBrains Mono";
  });
  const [fontLigatures, setFontLigatures] = useState(() => {
    return localStorage.getItem("codesprint-font-ligatures") === "true";
  });

  useEffect(() => {
    localStorage.setItem("codesprint-vim-mode", vimMode.toString());
  }, [vimMode]);

  useEffect(() => {
    localStorage.setItem("codesprint-font-size", fontSize.toString());
    localStorage.setItem("codesprint-font-family", fontFamily);
    localStorage.setItem("codesprint-font-ligatures", fontLigatures.toString());
  }, [fontSize, fontFamily, fontLigatures]);

  useEffect(() => {
    setCode(challenge?.starter ?? "");
    setResult(null);
  }, [challenge?.id]);

  const viewRef = useRef(null);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontCompartment.reconfigure(buildFontTheme(fontFamily, fontSize, fontLigatures)),
      });
    }
  }, [fontFamily, fontSize, fontLigatures]);

  // Auto-scroll terminal to bottom when results change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [result]);

  const { prevChallenge, nextChallenge, position } = useMemo(() => {
    if (!sub) return { prevChallenge: null, nextChallenge: null, position: 0 };
    const list = sub.challenges;
    const idx = list.findIndex((c) => c.id === id);
    return {
      prevChallenge: idx > 0 ? list[idx - 1] : null,
      nextChallenge: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
      position: idx + 1,
    };
  }, [sub, id]);

  if (!section || !sub || !challenge) return <Navigate to="/" replace />;

  const runningRef = useRef(running);
  runningRef.current = running;

  async function handleRun() {
    if (runningRef.current) return;
    setRunning(true);
    try {
      const res = await runChallenge(code, challenge);
      setResult(res);
      if (res.passed) markComplete(challenge.id);
    } finally {
      setRunning(false);
    }
  }

  const handleRunRef = useRef(handleRun);
  handleRunRef.current = handleRun;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onCodeChange = useCallback((value) => {
    setCode(value);
  }, []);

  const done = isComplete(challenge.id);
  const isDom = challenge.kind === "domRead" || challenge.kind === "domMutate";

  // Terminal status: idle | running | passed | failed
  const terminalStatus = running
    ? "running"
    : result
      ? result.passed
        ? "passed"
        : "failed"
      : "idle";

  const statusDotColor = {
    idle: "bg-faint",
    running: "bg-warn",
    passed: "bg-good",
    failed: "bg-bad",
  };

  return (
    <div className="challenge-layout">
      {/* ───────── LEFT PANE: Problem Description ───────── */}
      <div className="challenge-left-pane">
        <div className="px-6 py-6 lg:px-8 lg:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-2xs font-mono text-faint mb-5 flex-wrap">
            <Link to="/" className="hover:text-muted transition-colors">tracks</Link>
            <span>/</span>
            <Link to={`/section/${sectionSlug}`} className="hover:text-muted transition-colors">{section.title}</Link>
            <span>/</span>
            <Link to={`/section/${sectionSlug}/${subSlug}`} className="hover:text-muted transition-colors">{sub.title}</Link>
            <span>/</span>
            <span className="text-muted">{position} of {sub.challenges.length}</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-semibold text-text tracking-tight">{challenge.title}</h1>
            {done && <span className="text-good text-sm">✓</span>}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 mb-5 text-2xs font-mono">
            <span className={difficultyColor[challenge.difficulty]}>{challenge.difficulty}</span>
            <span className="text-faint">~{challenge.minutes} min</span>
            {isDom && <span className="px-1.5 py-0.5 rounded bg-surface3 text-muted">DOM</span>}
          </div>

          {/* Description */}
          <p className="text-[14.5px] text-muted leading-relaxed mb-6">{challenge.prompt}</p>

          {/* Starting HTML (DOM challenges) */}
          {isDom && challenge.setupHTML && (
            <div className="border border-line rounded-lg overflow-hidden bg-surface mb-4">
              <div className="px-4 py-2.5 border-b border-line bg-surface2">
                <span className="text-2xs font-mono text-faint uppercase tracking-wider">Starting HTML</span>
              </div>
              <pre className="px-4 py-3 text-[12.5px] leading-[1.7] font-mono text-muted overflow-x-auto">
{challenge.setupHTML}
              </pre>
            </div>
          )}

          {/* Examples / Requirements */}
          <div className="border border-line rounded-lg overflow-hidden bg-surface">
            <div className="px-4 py-2.5 border-b border-line bg-surface2">
              <span className="text-2xs font-mono text-faint uppercase tracking-wider">
                {challenge.kind === "domMutate" ? "Requirements" : "Examples"}
              </span>
            </div>
            <ul className="divide-y divide-line">
              {challenge.kind === "domMutate"
                ? challenge.tests.map((t, i) => (
                    <li key={i} className="px-4 py-2.5 font-mono text-[12.5px] text-muted">
                      {t.description}
                    </li>
                  ))
                : challenge.tests.map((t, i) => (
                    <li key={i} className="px-4 py-2.5 font-mono text-[12.5px] text-muted">
                      {challenge.kind === "domRead"
                        ? "solve(container)"
                        : `solve(${formatArgs(t.args)})`}{" "}
                      <span className="text-faint">→</span>{" "}
                      <span className="text-text">{JSON.stringify(t.expected)}</span>
                    </li>
                  ))}
            </ul>
          </div>

          {/* Previous navigation */}
          <div className="mt-6 flex items-center gap-3">
            {prevChallenge ? (
              <button
                onClick={() => navigate(`/section/${sectionSlug}/${subSlug}/${prevChallenge.id}`)}
                className="text-2xs font-mono text-faint hover:text-muted transition-colors"
              >
                ← previous
              </button>
            ) : <span />}
          </div>
        </div>
      </div>

      {/* ───────── RIGHT PANE: Editor + Terminal ───────── */}
      <div className="challenge-right-pane">
        {/* ── Editor Section (~60%) ── */}
        <div className="flex flex-col min-h-0" style={{ flex: "3 1 0%" }}>
          {/* Editor header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface2 flex-shrink-0 relative">
            <span className="text-2xs font-mono text-faint">{challenge.id}.js</span>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`text-sm transition-colors ${settingsOpen ? "text-text" : "text-faint hover:text-muted"}`}
                  title="Editor Settings"
                >
                  ⚙
                </button>
                {settingsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-surface2 border border-line rounded-lg shadow-xl z-50 p-4 font-sans text-[13px] flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-text font-medium">Font</span>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="bg-surface border border-line rounded px-2 py-1 text-text outline-none focus:border-faint text-xs font-mono w-40"
                        >
                          <option value="JetBrains Mono">JetBrains Mono</option>
                          <option value="Fira Code">Fira Code</option>
                          <option value="Ubuntu Mono">Ubuntu Mono</option>
                          <option value="Source Code Pro">Source Code Pro</option>
                          <option value="monospace">Default</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text font-medium">Font size</span>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                          className="bg-surface border border-line rounded px-2 py-1 text-text outline-none focus:border-faint text-xs w-40"
                        >
                          <option value="12">12px</option>
                          <option value="14">14px</option>
                          <option value="16">16px</option>
                          <option value="18">18px</option>
                          <option value="20">20px</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text font-medium">Font ligatures</span>
                        <button
                          onClick={() => setFontLigatures(!fontLigatures)}
                          className={`w-8 h-4 rounded-full relative transition-colors ${fontLigatures ? "bg-accent" : "bg-surface3"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${fontLigatures ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setVimMode(!vimMode)}
                className={`text-2xs font-mono transition-colors ${vimMode ? "text-accent" : "text-faint hover:text-muted"}`}
              >
                vim
              </button>
              <button
                onClick={() => setCode(challenge.starter)}
                className="text-2xs font-mono text-faint hover:text-muted transition-colors"
              >
                reset
              </button>
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 min-h-0 overflow-hidden cm-editor-wrapper">
            <CodeMirror
              value={code}
              height="auto"
              theme={oneDark}
              extensions={[
                ...(vimMode ? [vim({ status: true })] : []),
                fontCompartment.of(buildFontTheme(fontFamily, fontSize, fontLigatures)),
                javascript()
              ]}
              onCreateEditor={(view) => {
                viewRef.current = view;
              }}
              basicSetup={{
                autocompletion: false,
                closeBrackets: true,
                bracketMatching: true,
                foldGutter: true,
                lineNumbers: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                indentOnInput: true,
              }}
              onChange={onCodeChange}
            />
          </div>

          {/* Run bar */}
          <div className="px-4 py-3 border-t border-line bg-surface2 flex items-center justify-between flex-shrink-0">
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-1.5 rounded-md bg-accent hover:bg-accentDim text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {running ? "Running…" : "Run tests"}
              {!running && <span className="text-[10px] text-white/60 font-mono tracking-tighter">⌘↵</span>}
            </button>
            {result && (
              <span className={`text-2xs font-mono ${result.passed ? "text-good" : "text-bad"}`}>
                {result.passed
                  ? "all tests passed"
                  : `${result.results.filter((r) => r.pass).length}/${result.results.length} passed`}
              </span>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-line flex-shrink-0" />

        {/* ── Terminal Section (~40%) ── */}
        <div className="flex flex-col min-h-0" style={{ flex: "2 1 0%" }}>
          {/* Terminal header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#21262d] bg-terminal flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-2xs font-mono uppercase tracking-wider text-termText/60">Output</span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${statusDotColor[terminalStatus]} ${
                  terminalStatus === "running" ? "status-dot-running" : ""
                }`}
              />
            </div>
            {result && (
              <button
                onClick={() => setResult(null)}
                className="text-2xs font-mono text-termText/40 hover:text-termText/70 transition-colors"
              >
                clear
              </button>
            )}
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="terminal-body flex-1 min-h-0 bg-terminal px-4 py-3 font-mono text-[12.5px] leading-[1.8]"
          >
            {!result && !running && (
              <div className="text-termText/30 italic select-none">
                Run tests to see output…
              </div>
            )}

            {running && !result && (
              <div className="text-warn flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-warn status-dot-running" />
                Running tests…
              </div>
            )}

            {result && result.compileError && (
              <div className="space-y-2">
                <div className="text-bad font-semibold">✗ Compile Error</div>
                <pre className="text-bad/80 whitespace-pre-wrap break-words text-[12px]">{result.compileError}</pre>
              </div>
            )}

            {result && !result.compileError && (
              <div className="space-y-1">
                {result.results.map((r) => (
                  <div key={r.index} className="group">
                    <div className="flex items-start gap-2">
                      <span className={`flex-shrink-0 ${r.pass ? "text-termGreen" : "text-bad"}`}>
                        {r.pass ? "✓" : "✗"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-termText">{r.label}</span>
                        {r.pass ? (
                          <span className="text-termGreen/60 ml-2">→ {r.expectedDisplay}</span>
                        ) : (
                          <div className="mt-0.5 text-[11.5px]">
                            {r.error ? (
                              <span className="text-bad">threw: {r.error}</span>
                            ) : r.expectedDisplay !== null ? (
                              <>
                                <span className="text-termText/50">expected </span>
                                <span className="text-termText">{r.expectedDisplay}</span>
                                <span className="text-termText/50">, got </span>
                                <span className="text-bad">{r.actualDisplay}</span>
                              </>
                            ) : (
                              <span className="text-bad">requirement not met</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Success footer */}
            {result && result.passed && (
              <div className="mt-4 pt-3 border-t border-termGreen/15 flex items-center justify-between">
                <span className="text-termGreen text-[13px]">
                  Nice — every test passed.
                </span>
                {nextChallenge ? (
                  <button
                    onClick={() => navigate(`/section/${sectionSlug}/${subSlug}/${nextChallenge.id}`)}
                    className="text-2xs font-mono text-termGreen hover:underline"
                  >
                    next drill →
                  </button>
                ) : (
                  <Link to={`/section/${sectionSlug}`} className="text-2xs font-mono text-termGreen hover:underline">
                    back to section →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
