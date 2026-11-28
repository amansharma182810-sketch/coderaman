import React, { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Textarea } from "../components/Textarea";
import { Badge } from "../components/Badge";
import styles from "./_index.module.css";
import { postResearch } from "../endpoints/research_POST.schema";
import { useAuth } from "../helpers/useAuth";
import superjson from "superjson";

type Source = { title: string; url: string; note: string };
type Report = { title: string; summary: string; sections: { heading: string; body: string }[]; sources: Source[] };

const examples = [
  "How will AI agents change software engineering by 2030?",
  "Compare open-source vector databases for production RAG",
  "What are the biggest barriers to humanoid robot adoption?",
];

export default function HomePage() {
  const [goal, setGoal] = useState("");
  const [depth, setDepth] = useState("Standard");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showSources, setShowSources] = useState(true);
  const { authState, logout } = useAuth();
  const currentUser = authState.type === "authenticated" ? authState.user : null;

  useEffect(() => {
    let active = true;
    fetch("/_api/research/history").then(async (response) => {
      if (!response.ok) return;
      const data = superjson.parse<{ runs: { goal: string }[] }>(await response.text());
      if (active) setHistory(data.runs.map((run) => run.goal));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function runResearch(value = goal) {
    if (!value.trim() || running) return;
    setGoal(value); setRunning(true); setReport(null); setError("");
    setHistory((old) => [value, ...old.filter((x) => x !== value)].slice(0, 5));
    try {
      const data = await postResearch({ goal: value, depth: depth as "Quick" | "Standard" | "Deep dive" });
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setRunning(false); }
  }

  function downloadReport() {
    if (!report) return;
    const content = ["# " + report.title, "", report.summary, "", ...report.sections.flatMap((s) => ["## " + s.heading, s.body, ""]), "## Sources", ...report.sources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`)].join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orbit-research-report.md"; a.click();
    URL.revokeObjectURL(url);
  }

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><div className={styles.brandMark}><span>O</span><i /></div><div><strong>ORBIT</strong><small>RESEARCH INTELLIGENCE</small></div></div>
      <div className={styles.sideLabel}>WORKSPACE</div>
      <div className={`${styles.navItem} ${styles.navActive}`}><span>✳</span> New research</div>
      <div className={styles.sideLabel}>RECENT RUNS</div>
      {history.length ? history.map((item, i) => <button key={i} className={styles.historyItem} onClick={() => setGoal(item)}>{item}</button>) : <p className={styles.emptyHistory}>Your research sessions will appear here.</p>}
      <div className={styles.sidebarBottom}><div className={styles.statusDot} /> <span>Systems operational</span><span className={styles.version}>V 1.0.0</span></div>
    </aside>
    <section className={styles.main}>
      <header className={styles.topbar}><div className={styles.breadcrumb}>Workspace <span>/</span> <b>New research</b></div><div className={styles.topRight}><Badge variant="success">PRIVATE WORKSPACE</Badge><div className={styles.avatar}>{currentUser?.displayName?.slice(0,2).toUpperCase() || "OR"}</div><button onClick={() => logout()}>Sign out</button></div></header>
      <div className={styles.content}>
        <div className={styles.eyebrow}><span className={styles.pulse} /> AUTONOMOUS RESEARCH SYSTEM <span className={styles.eyebrowLine} /></div>
        <h1>Ideas into <em>intelligence.</em></h1>
        <p className={styles.lede}>Give ORBIT a research goal. Your agent team will plan the investigation, gather evidence, and synthesize a report you can act on.</p>
        <div className={styles.composer}>
          <div className={styles.composerTop}><span>RESEARCH OBJECTIVE</span><span className={styles.secure}>SECURE SESSION</span></div>
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What would you like to understand?" rows={4} className={styles.goalInput} />
          <div className={styles.composerFooter}><div className={styles.depthControl}><span>DEPTH</span>{["Quick", "Standard", "Deep dive"].map((d) => <button key={d} onClick={() => setDepth(d)} className={depth === d ? styles.depthSelected : ""}>{d}</button>)}</div><Button onClick={() => runResearch()} disabled={!goal.trim() || running} className={styles.runButton}>{running ? "Researching…" : "Start research"}<span>↗</span></Button></div>
        </div>
        {!report && !running && <div className={styles.examples}><div className={styles.exampleLabel}>TRY A RESEARCH PROMPT</div><div className={styles.exampleGrid}>{examples.map((item, i) => <button key={item} className={styles.exampleCard} onClick={() => setGoal(item)}><span>0{i + 1}</span><p>{item}</p><b>↗</b></button>)}</div></div>}
        {running && <div className={styles.progressPanel}><div className={styles.progressHead}>ORBIT / RUNNING</div><div className={styles.agentGrid}>{["Planner", "Researcher", "Analyst", "Writer"].map((name) => <div className={styles.agent} key={name}><strong>{name}</strong></div>)}</div><p className={styles.progressNote}>Four-stage workflow runs sequentially. Stage-level live telemetry is not yet available.</p></div>}
        {error && <div className={styles.errorBox}><strong>Research stopped</strong><p>{error}</p></div>}
        {report && <section className={styles.report}><div className={styles.reportTop}><div><div className={styles.reportKicker}>RESEARCH OUTPUT <Badge variant="success">COMPLETED</Badge></div><h2>{report.title}</h2><p>{report.summary}</p></div><Button variant="outline" onClick={downloadReport}>Export .md</Button></div><div className={styles.reportBody}>{report.sections.map((section, i) => <article key={section.heading}><div className={styles.sectionNumber}>0{i + 1}</div><div><h3>{section.heading}</h3><p>{section.body}</p></div></article>)}</div><div className={styles.sourcesHeader}><button onClick={() => setShowSources(!showSources)}>SOURCES & REFERENCES ({report.sources.length})</button></div>{showSources && <div className={styles.sources}>{report.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{source.title}</strong><small>{source.note}</small></div></a>)}</div>}</section>}
      </div>
    </section>
  </main>;
}
