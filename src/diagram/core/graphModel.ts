import { Children, Fragment, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

import { DiagramEdge } from '../api/DiagramEdge'
import { DiagramNode } from '../api/DiagramNode'
import { SubgraphNode } from '../api/SubgraphNode'
import type { DiagramEdgeProps, DiagramNodeProps, SubgraphNodeProps } from '../api/types'
import { USE_CASE_NODE_TYPE, type RawGraphEdge, type RawGraphNode } from '../types/graph'

type LayoutHint = {
  xs?: number
  sm?: number
  md?: number
}

export type GraphModel = {
  nodes: RawGraphNode[]
  edges: RawGraphEdge[]
  hints: Map<string, LayoutHint>
  subgraphs: Map<string, { grid?: SubgraphNodeProps['grid']; children: string[] }>
}

const isDiagramNodeElement = (el: ReactElement): el is ReactElement<DiagramNodeProps> => el.type === DiagramNode
const isDiagramEdgeElement = (el: ReactElement): el is ReactElement<DiagramEdgeProps> => el.type === DiagramEdge
const isSubgraphElement = (el: ReactElement): el is ReactElement<SubgraphNodeProps> => el.type === SubgraphNode

export function buildGraphModel(children: ReactNode): GraphModel {
  const nodes: RawGraphNode[] = []
  const edges: RawGraphEdge[] = []
  const hints = new Map<string, LayoutHint>()
  const subgraphs = new Map<string, { grid?: SubgraphNodeProps['grid']; children: string[] }>()

  const registerSubgraphChild = (childId: string, parentId?: string) => {
    if (!parentId) return
    const meta = subgraphs.get(parentId)
    if (meta) meta.children.push(childId)
  }

  const walk = (child: ReactNode, parentId?: string) => {
    if (!isValidElement(child)) return

    if (isSubgraphElement(child)) {
      const props = child.props as SubgraphNodeProps
      const nextParentId = props.parentId ?? parentId

      nodes.push({
        id: props.id,
        label: props.label,
        type: USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY,
        ...(props.width ? { width: props.width } : {}),
        ...(props.height ? { height: props.height } : {}),
        ...(nextParentId ? { parentId: nextParentId } : {}),
      })
      hints.set(props.id, { xs: props.xs, sm: props.sm, md: props.md })
      subgraphs.set(props.id, { grid: props.grid, children: [] })
      registerSubgraphChild(props.id, nextParentId)

      Children.forEach(props.children, (grandChild) => walk(grandChild, props.id))
      return
    }

    if (isDiagramNodeElement(child)) {
      const props = child.props as DiagramNodeProps
      const nextParentId = props.parentId ?? parentId
      nodes.push({
        id: props.id,
        label: props.label,
        type: props.kind,
        ...(props.icon ? { icon: props.icon } : {}),
        ...(props.media ? { media: props.media } : {}),
        ...(props.properties ? { properties: props.properties } : {}),
        ...(props.width ? { width: props.width } : {}),
        ...(props.height ? { height: props.height } : {}),
        ...(nextParentId ? { parentId: nextParentId } : {}),
      })
      hints.set(props.id, { xs: props.xs, sm: props.sm, md: props.md })
      registerSubgraphChild(props.id, nextParentId)

      const cascadeParent = props.kind === 'SYSTEM_BOUNDARY' ? props.id : nextParentId
      Children.forEach(props.children, (grandChild) => walk(grandChild, cascadeParent))
      return
    }

    if (isDiagramEdgeElement(child)) {
      const props = child.props as DiagramEdgeProps
      edges.push({
        id: props.id,
        source: props.from,
        target: props.to,
        type: props.kind,
        ...(props.label ? { label: props.label } : {}),
      })
      return
    }

    if (child.type === Fragment) {
      const fragmentChildren = (child.props as { children?: ReactNode }).children
      Children.forEach(fragmentChildren, (nested) => walk(nested, parentId))
      return
    }

    const genericProps = child.props as { children?: ReactNode } | undefined
    if (genericProps?.children) {
      Children.forEach(genericProps.children, (nested: ReactNode) => walk(nested, parentId))
    }
  }

  Children.forEach(Children.toArray(children), (child) => walk(child, undefined))

  return { nodes, edges, hints, subgraphs }
}
