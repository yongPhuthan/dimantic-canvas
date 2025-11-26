import { UseCaseDiagramCanvas } from './diagram/usecase/components/UseCaseDiagramCanvas'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">GraphWeaver-RF · Mock</p>
          <h1 className="text-3xl font-semibold leading-tight">Use Case Diagram Engine (React Flow 12)</h1>
          <p className="max-w-4xl text-sm text-muted-foreground">
            Rendered from mock Neo4j-style JSON → ELK layered layout → React Flow custom nodes/edges.
            Backend wiring intentionally deferred; this view exercises layout, grouping, edge styling, and fit view.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card/80 shadow-card ring-1 ring-border/60 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.18)]" />
              <div className="text-sm font-semibold">Mock Data Session</div>
              <div className="text-xs text-muted-foreground">Auto-layout via ELK · Floating edges with include/extend labels</div>
            </div>
            <div className="rounded-full bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">
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
