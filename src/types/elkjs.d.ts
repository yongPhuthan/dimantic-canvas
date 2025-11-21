declare module 'elkjs/lib/elk.bundled.js' {
  const ELK: new (options?: { workerUrl?: string }) => {
    layout: (graph: unknown) => Promise<unknown>
  }
  export default ELK
}

declare module 'elkjs/lib/elk-worker.js' {
  const workerPath: string
  export default workerPath
}
