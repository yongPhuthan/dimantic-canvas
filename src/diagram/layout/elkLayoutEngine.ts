import ELK from 'elkjs/lib/elk.bundled.js'

import { USE_CASE_NODE_TYPE, type RawGraphEdge, type RawGraphNode } from '../types/graph'
import type { LayoutConfig } from '../api/types'
import type { GraphModel } from '../core/graphModel'

type ElkLayoutNode = {
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  children?: ElkLayoutNode[]
  labels?: { text: string }[]
}

type ElkEdgeInput = {
  id: string
  sources: string[]
  targets: string[]
}

type ElkGraphInput = {
  id: string
  layoutOptions: Record<string, string>
  children: ElkLayoutNode[]
  edges: ElkEdgeInput[]
}

type ElkLayoutComputed = ElkLayoutNode & { children?: ElkLayoutNode[] }

export type LayoutResultNode = RawGraphNode & { x: number; y: number; width: number; height: number }
export type LayoutResult = { nodes: LayoutResultNode[]; edges: RawGraphEdge[] }

const elk = new ELK()

const BASE_SIZE: Record<RawGraphNode['type'], { width: number; height: number }> = {
  [USE_CASE_NODE_TYPE.ACTOR]: { width: 140, height: 140 },
  [USE_CASE_NODE_TYPE.USE_CASE]: { width: 160, height: 160 },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: { width: 240, height: 240 },
}

const CHAR_WIDTH = 8
const LABEL_PADDING = 48

function labelBasedWidth(label: string, base: number) {
  return Math.max(base, label.length * CHAR_WIDTH + LABEL_PADDING)
}

function applyLayoutOptions(config: LayoutConfig): Record<string, string> {
  const spacing = (config.spacing ?? 2) * 60
  const padding = config.padding ?? 56
  return {
    'org.eclipse.elk.algorithm': 'layered',
    'org.eclipse.elk.direction': config.direction ?? 'RIGHT',
    'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': `${spacing}`,
    'org.eclipse.elk.spacing.nodeNode': `${Math.max(120, spacing * 1.4)}`,
    'org.eclipse.elk.spacing.edgeEdge': `${Math.max(80, spacing * 0.9)}`,
    'org.eclipse.elk.spacing.componentComponent': `${Math.max(120, spacing)}`,
    'org.eclipse.elk.hierarchyHandling': config.hierarchy ?? 'INCLUDE_CHILDREN',
    'org.eclipse.elk.layered.edgeRouting': 'ORTHOGONAL',
    'org.eclipse.elk.layered.edgeSpacingFactor': '1.4',
    'org.eclipse.elk.padding': `[${padding},${padding},${padding},${padding}]`,
    'org.eclipse.elk.spacing.labelNode': '28',
    'org.eclipse.elk.spacing.labelLabel': '28',
  }
}

function buildElkGraph(graph: GraphModel, config: LayoutConfig): ElkGraphInput {
  const elkNodes = new Map<string, ElkLayoutNode>()

  graph.nodes.forEach((node) => {
    const base = BASE_SIZE[node.type]
    const span = config.grid ? graph.hints.get(node.id) : undefined
    const spanFactor = span?.md ?? span?.sm ?? span?.xs ?? 0
    const widthBoost = spanFactor > 0 ? (spanFactor / 3) * 80 : 0
    const preferredWidth = node.width
    const preferredHeight = node.height
    const elkNode: ElkLayoutNode = {
      id: node.id,
      width: preferredWidth ?? labelBasedWidth(node.label, base.width + widthBoost),
      height: preferredHeight ?? base.height,
      children: [],
      labels: [{ text: node.label }],
    }
    elkNodes.set(node.id, elkNode)
  })

  const roots: ElkLayoutNode[] = []

  graph.nodes.forEach((node) => {
    const elkNode = elkNodes.get(node.id)
    if (!elkNode) return
    if (node.parentId && elkNodes.has(node.parentId)) {
      const parent = elkNodes.get(node.parentId)
      if (!parent) return
      parent.children = parent.children ?? []
      parent.children.push(elkNode)
    } else {
      roots.push(elkNode)
    }
  })

  const elkEdges: ElkEdgeInput[] = graph.edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))

  return {
    id: 'graph',
    layoutOptions: applyLayoutOptions(config),
    children: roots,
    edges: elkEdges,
  }
}

export async function runElkLayout(graph: GraphModel, config: LayoutConfig): Promise<LayoutResult> {
  if (config.algorithm === 'none') {
    return {
      nodes: graph.nodes.map((node) => ({
        ...node,
        x: 0,
        y: 0,
        width: node.width ?? BASE_SIZE[node.type].width,
        height: node.height ?? BASE_SIZE[node.type].height,
      })),
      edges: graph.edges,
    }
  }

  const elkGraph = buildElkGraph(graph, config)

  const elkResult = (await elk.layout(elkGraph)) as ElkLayoutComputed

  const flattened: LayoutResultNode[] = []
  const nodeTypeMap = new Map(graph.nodes.map((n) => [n.id, n.type]))
  const parentMap = new Map(graph.nodes.map((n) => [n.id, n.parentId]))
  const sizeMap = new Map(graph.nodes.map((n) => [n.id, { width: n.width, height: n.height }]))

  const walk = (node: ElkLayoutNode, parentId?: string) => {
    const type = nodeTypeMap.get(node.id) ?? USE_CASE_NODE_TYPE.USE_CASE
    flattened.push({
      id: node.id,
      label: node.labels?.[0]?.text ?? node.id,
      type,
      parentId,
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? sizeMap.get(node.id)?.width ?? BASE_SIZE[type].width,
      height: node.height ?? sizeMap.get(node.id)?.height ?? BASE_SIZE[type].height,
    })
    node.children?.forEach((child: ElkLayoutNode) => walk(child, node.id))
  }

  elkResult.children?.forEach((child: ElkLayoutNode) => walk(child))

  // ELK may drop empty parents; ensure parentId propagated from source graph if missing.
  flattened.forEach((node) => {
    if (!node.parentId) {
      const fallbackParent = parentMap.get(node.id)
      if (fallbackParent) node.parentId = fallbackParent
    }
  })

  return {
    nodes: flattened,
    edges: graph.edges,
  }
}
