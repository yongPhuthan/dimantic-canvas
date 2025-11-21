import { UseCaseDiagramCanvas } from './diagram/usecase/components/UseCaseDiagramCanvas'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">GraphWeaver-RF · Mock</p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-50">
            Use Case Diagram Engine (React Flow 12)
          </h1>
          <p className="max-w-4xl text-sm text-slate-300">
            Rendered from mock Neo4j-style JSON → ELK layered layout → React Flow custom nodes/edges.
            Backend wiring intentionally deferred; this view exercises layout, grouping, edge styling, and fit view.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl ring-1 ring-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]" />
              <div className="text-sm font-semibold text-slate-100">Mock Data Session</div>
              <div className="text-xs text-slate-400">Auto-layout via ELK · Floating edges with include/extend labels</div>
            </div>
            <div className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300">
              Drag to explore · Scroll to zoom
            </div>
          </div>

          {/* Diagram canvas uses mock graph + ELK layout; backend can later swap the graph input. */}
          <div className="h-[720px]">
            <UseCaseDiagramCanvas />
          </div>
        </section>
      </main>
    </div>
  )
}
