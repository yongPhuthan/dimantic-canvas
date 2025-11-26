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
      const fit = () => fitView({ padding: 0.2, includeHiddenNodes: true })
      requestAnimationFrame(fit)
      const timeout = window.setTimeout(fit, 80) // rerun after layout settles
      return () => window.clearTimeout(timeout)
    }
  }, [fitView, isLoading, layoutNodes])

  return (
    <div className="h-full w-full">
      <ReactFlow
        onInit={(instance) => instance.fitView({ padding: 0.2, duration: 0 })}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeSafe}
        nodeTypes={diagramNodeTypes}
        edgeTypes={diagramEdgeTypes}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
        panOnScroll
        zoomOnScroll
        elevateEdgesOnSelect
      >
        <Background gap={24} color="hsl(var(--border))" />
        <MiniMap
          pannable
          zoomable
          nodeStrokeColor="hsl(var(--muted-foreground))"
          maskColor="hsl(var(--background) / 0.9)"
          style={{ display: 'none' }} // keep registered but hidden for now
        />
        <Controls />

        <Panel position="top-left" className="rounded-lg border border-border bg-card/90 px-3 py-2 text-xs text-foreground shadow-card backdrop-blur">
          <div className="font-semibold">Use Case Diagram</div>
          <div className="text-[11px] text-muted-foreground">Declarative JSX API · ELK auto-layout · React Flow 12</div>
        </Panel>

        {isLoading ? (
          <Panel position="bottom-left" className="rounded-lg border border-border bg-card/80 px-3 py-1 text-xs text-foreground shadow-card">
            Laying out graph with ELK...
          </Panel>
        ) : null}
        {error ? (
          <Panel position="bottom-left" className="mt-2 rounded-lg border border-destructive/40 bg-destructive/80 px-3 py-1 text-xs text-destructive-foreground shadow-card">
            Layout error: {error.message}
          </Panel>
        ) : null}
      </ReactFlow>
    </div>
  )
}
