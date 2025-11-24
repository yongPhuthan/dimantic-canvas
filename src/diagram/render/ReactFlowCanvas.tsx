import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { useCallback, useEffect } from 'react'

import { diagramEdgeTypes, diagramNodeTypes } from '../core/rfAdapter'
import type { UseCaseReactFlowEdge, UseCaseReactFlowNode } from '../types/graph'

type Props = {
  nodes: UseCaseReactFlowNode[]
  edges: UseCaseReactFlowEdge[]
  isLoading: boolean
  error: Error | null
}

export function ReactFlowCanvas({ nodes: layoutNodes, edges: layoutEdges, isLoading, error }: Props) {
  const { fitView } = useReactFlow<UseCaseReactFlowNode, UseCaseReactFlowEdge>()
  const [nodes, setNodes] = useNodesState<UseCaseReactFlowNode>(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<UseCaseReactFlowEdge>(layoutEdges)

  const onNodesChange = useCallback(
    (changes: NodeChange<UseCaseReactFlowNode>[]) =>
      setNodes((current) => applyNodeChanges(changes as NodeChange<UseCaseReactFlowNode>[], current)),
    [setNodes],
  )

  const onEdgesChangeSafe = useCallback(
    (changes: EdgeChange<UseCaseReactFlowEdge>[]) => onEdgesChange(changes as EdgeChange<UseCaseReactFlowEdge>[]),
    [onEdgesChange],
  )

  useEffect(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutEdges, layoutNodes, setEdges, setNodes])

  useEffect(() => {
    if (!isLoading && layoutNodes.length > 0) {
      requestAnimationFrame(() => fitView({ padding: 0.2 }))
    }
  }, [fitView, isLoading, layoutNodes])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeSafe}
        nodeTypes={diagramNodeTypes}
        edgeTypes={diagramEdgeTypes}
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
          <div className="text-[11px] opacity-80">Declarative JSX API · ELK auto-layout · React Flow 12</div>
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
