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
type NodeSize = { width: number; height: number }
type SubgraphLayout = { size: NodeSize; placements: { childId: string; x: number; y: number }[] }

const elk = new ELK()

const BASE_SIZE: Record<RawGraphNode['type'], { width: number; height: number }> = {
  [USE_CASE_NODE_TYPE.ACTOR]: { width: 140, height: 140 },
  [USE_CASE_NODE_TYPE.USE_CASE]: { width: 160, height: 160 },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: { width: 240, height: 240 },
}

const CHAR_WIDTH = 8
const LABEL_PADDING = 48
const GRID_GAP_UNIT = 8
const LABEL_BAND_HEIGHT = 28
const MIN_COLUMN_WIDTH = 48
const MIN_GAP = 4

function labelBasedWidth(label: string, base: number) {
  return Math.max(base, label.length * CHAR_WIDTH + LABEL_PADDING)
}

function resolveNodeSizes(graph: GraphModel, config: LayoutConfig): Map<string, NodeSize> {
  const sizes = new Map<string, NodeSize>()
  graph.nodes.forEach((node) => {
    const base = BASE_SIZE[node.type]
    const span = config.grid ? graph.hints.get(node.id) : undefined
    const spanFactor = span?.md ?? span?.sm ?? span?.xs ?? 0
    const widthBoost = spanFactor > 0 ? (spanFactor / 3) * 80 : 0
    const width = node.width ?? labelBasedWidth(node.label, base.width + widthBoost)
    const height = node.height ?? base.height
    sizes.set(node.id, { width, height })
  })
  return sizes
}

function applySubgraphGrid(graph: GraphModel, sizeMap: Map<string, NodeSize>): Map<string, SubgraphLayout> {
  const layouts = new Map<string, SubgraphLayout>()
  const childrenByParent = new Map<string, RawGraphNode[]>()

  graph.nodes.forEach((node) => {
    if (!node.parentId) return
    const list = childrenByParent.get(node.parentId) ?? []
    list.push(node)
    childrenByParent.set(node.parentId, list)
  })

  const compute = (subgraphId: string): SubgraphLayout => {
    if (layouts.has(subgraphId)) return layouts.get(subgraphId)!

    const baseSize = sizeMap.get(subgraphId) ?? BASE_SIZE[USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]
    const meta = graph.subgraphs.get(subgraphId)
    const children = childrenByParent.get(subgraphId) ?? []

    children.forEach((child) => {
      if (graph.subgraphs.has(child.id)) compute(child.id)
    })

    if (!meta || children.length === 0) {
      const size = { width: baseSize.width, height: baseSize.height + LABEL_BAND_HEIGHT }
      const layout = { size, placements: [] }
      layouts.set(subgraphId, layout)
      sizeMap.set(subgraphId, size)
      return layout
    }

    const columns = Math.max(1, meta.grid?.columns ?? 12)
    const gap = Math.max(MIN_GAP, (meta.grid?.spacing ?? 2) * GRID_GAP_UNIT)
    const padding = gap
    const defaultSpan = Math.min(columns, 6)

    const spans = children.map((child) => {
      const hint = graph.hints.get(child.id)
      const span = hint?.md ?? hint?.sm ?? hint?.xs ?? defaultSpan
      return Math.min(columns, Math.max(1, span))
    })

    const columnWidth = Math.max(
      MIN_COLUMN_WIDTH,
      ...children.map((child, idx) => {
        const span = spans[idx] ?? 1
        const size = sizeMap.get(child.id) ?? BASE_SIZE[child.type]
        return size.width / Math.max(1, span)
      }),
    )

    let cursor = 0
    let y = padding
    let rowHeight = 0
    let maxColumnsUsed = 0
    const placements: { childId: string; x: number; y: number }[] = []

    children.forEach((child, idx) => {
      const span = spans[idx] ?? 1
      if (cursor + span > columns && cursor > 0) {
        y += rowHeight + gap
        cursor = 0
        rowHeight = 0
      }

      const size = sizeMap.get(child.id) ?? BASE_SIZE[child.type]
      const x = padding + cursor * (columnWidth + gap)
      placements.push({ childId: child.id, x, y })
      cursor += span
      rowHeight = Math.max(rowHeight, size.height)
      maxColumnsUsed = Math.max(maxColumnsUsed, cursor)
    })

    const usedCols = Math.max(1, Math.min(columns, maxColumnsUsed || columns))
    const width = Math.max(baseSize.width, padding * 2 + usedCols * columnWidth + (usedCols - 1) * gap)
    const height = Math.max(baseSize.height, y + rowHeight + padding + LABEL_BAND_HEIGHT)

    const layout = { size: { width, height }, placements }
    layouts.set(subgraphId, layout)
    sizeMap.set(subgraphId, layout.size)
    return layout
  }

  graph.subgraphs.forEach((_meta, id) => compute(id))

  return layouts
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

function buildElkGraph(
  graph: GraphModel,
  config: LayoutConfig,
  sizeMap: Map<string, NodeSize>,
  placements: Map<string, { x: number; y: number }>,
): ElkGraphInput {
  const elkNodes = new Map<string, ElkLayoutNode>()

  graph.nodes.forEach((node) => {
    const size = sizeMap.get(node.id) ?? BASE_SIZE[node.type]
    const placement = placements.get(node.id)
    const elkNode: ElkLayoutNode = {
      id: node.id,
      width: size.width,
      height: size.height,
      children: [],
      labels: [{ text: node.label }],
      ...(placement ? { x: placement.x, y: placement.y } : {}),
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
  const sizeMap = resolveNodeSizes(graph, config)
  const subgraphLayouts = applySubgraphGrid(graph, sizeMap)

  const placementByChild = new Map<string, { x: number; y: number; parentId: string }>()
  subgraphLayouts.forEach((layout, parentId) => {
    layout.placements.forEach((placement) => {
      placementByChild.set(placement.childId, { ...placement, parentId })
    })
  })

  const fixedPositions = new Map<string, { x: number; y: number }>()
  placementByChild.forEach(({ x, y }, nodeId) => fixedPositions.set(nodeId, { x, y }))

  if (config.algorithm === 'none') {
    return {
      nodes: graph.nodes.map((node) => {
        const placement = placementByChild.get(node.id)
        const size = subgraphLayouts.get(node.id)?.size ?? sizeMap.get(node.id) ?? BASE_SIZE[node.type]
        return {
          ...node,
          parentId: placement?.parentId ?? node.parentId,
          x: placement?.x ?? 0,
          y: placement?.y ?? 0,
          width: size.width,
          height: size.height,
        }
      }),
      edges: graph.edges,
    }
  }

  const elkGraph = buildElkGraph(graph, config, sizeMap, fixedPositions)
  const elkResult = (await elk.layout(elkGraph)) as ElkLayoutComputed

  const flattened: LayoutResultNode[] = []
  const nodeTypeMap = new Map(graph.nodes.map((n) => [n.id, n.type]))
  const parentMap = new Map(graph.nodes.map((n) => [n.id, n.parentId]))

  const walk = (node: ElkLayoutNode, parentId?: string) => {
    const type = nodeTypeMap.get(node.id) ?? USE_CASE_NODE_TYPE.USE_CASE
    const placement = placementByChild.get(node.id)
    const subgraphSize = subgraphLayouts.get(node.id)?.size
    const baseSize = sizeMap.get(node.id) ?? BASE_SIZE[type]
    const width = subgraphSize?.width ?? node.width ?? baseSize.width
    const height = subgraphSize?.height ?? node.height ?? baseSize.height
    const nextParentId = placement?.parentId ?? parentId

    flattened.push({
      id: node.id,
      label: node.labels?.[0]?.text ?? node.id,
      type,
      parentId: nextParentId,
      x: placement?.x ?? node.x ?? 0,
      y: placement?.y ?? node.y ?? 0,
      width,
      height,
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
