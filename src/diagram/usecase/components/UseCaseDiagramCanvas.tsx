import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type Node,
  useReactFlow,
  useNodesState,
  type NodeChange,
} from '@xyflow/react'
import { useCallback, useEffect } from 'react'

import '@xyflow/react/dist/style.css'

import { FloatingEdge } from './edges/FloatingEdge'
import { ActorNode } from './nodes/ActorNode'
import { SystemNode } from './nodes/SystemNode'
import { UseCaseNode } from './nodes/UseCaseNode'
import { mockDenseConnectionsGraph } from '../mock/useCaseGraphDense'
import { useAutoLayout } from '../hooks/useAutoLayout'
import { USE_CASE_NODE_TYPE, type UseCaseNodeData } from '../types/graph'

const nodeTypes = {
  ACTOR: ActorNode,
  USE_CASE: UseCaseNode,
  SYSTEM_BOUNDARY: SystemNode,
}

const edgeTypes = { floating: FloatingEdge }

function DiagramInner() {
  const { result, isLoading, error } = useAutoLayout(mockDenseConnectionsGraph)
  const { fitView } = useReactFlow()
  const [nodes, setNodes] = useNodesState(result.nodes)
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<UseCaseNodeData>>[]) =>
      setNodes((current) => {
        const changed = applyNodeChanges(changes, current)
        return changed
      }),
    [setNodes],
  )

  // Sync layout output into the interactive nodes state whenever ELK finishes.
  useEffect(() => {
    if (!isLoading) {
      setNodes(result.nodes)
    }
  }, [isLoading, result.nodes, setNodes])

  useEffect(() => {
    if (!isLoading && result.nodes.length > 0) {
      // Fit view after layout finishes so the whole diagram is visible.
      requestAnimationFrame(() => fitView({ padding: 0.25 }))
    }
  }, [fitView, isLoading, result.nodes.length])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={result.edges}
        onNodesChange={handleNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
        panOnScroll
        zoomOnScroll
        elevateEdgesOnSelect
      >
        <Background gap={24} color="#1e293b" />
        <MiniMap pannable zoomable nodeStrokeColor="#94a3b8" maskColor="rgba(15,23,42,0.85)" />
        <Controls />

        <Panel position="top-left" className="rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg backdrop-blur">
          <div className="font-semibold">Use Case Diagram</div>
          <div className="text-[11px] opacity-80">
            Rendering mock data via ELK layout (no backend yet)
          </div>
        </Panel>

        {isLoading ? (
          <Panel position="bottom-left" className="rounded-lg bg-slate-900/80 px-3 py-1 text-xs text-slate-100 shadow">
            Laying out graph with ELK...
          </Panel>
        ) : null}
        {error ? (
          <Panel position="bottom-left" className="mt-2 rounded-lg bg-rose-900/80 px-3 py-1 text-xs text-rose-100 shadow">
            Layout error: {error.message}
          </Panel>
        ) : null}
      </ReactFlow>
    </div>
  )
}

export function UseCaseDiagramCanvas() {
  // Provider lives here so callers can just drop <UseCaseDiagramCanvas /> in any page.
  return (
    <ReactFlowProvider>
      <DiagramInner />
    </ReactFlowProvider>
  )
}
