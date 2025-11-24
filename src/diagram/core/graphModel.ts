import { Children, Fragment, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

import { DiagramEdge } from '../api/DiagramEdge'
import { DiagramNode } from '../api/DiagramNode'
import type { DiagramEdgeProps, DiagramNodeProps } from '../api/types'
import type { RawGraphEdge, RawGraphNode } from '../types/graph'

type LayoutHint = {
  xs?: number
  sm?: number
  md?: number
}

export type GraphModel = {
  nodes: RawGraphNode[]
  edges: RawGraphEdge[]
  hints: Map<string, LayoutHint>
}

const isDiagramNodeElement = (el: ReactElement): el is ReactElement<DiagramNodeProps> => el.type === DiagramNode
const isDiagramEdgeElement = (el: ReactElement): el is ReactElement<DiagramEdgeProps> => el.type === DiagramEdge

export function buildGraphModel(children: ReactNode): GraphModel {
  const nodes: RawGraphNode[] = []
  const edges: RawGraphEdge[] = []
  const hints = new Map<string, LayoutHint>()

  const walk = (child: ReactNode, parentId?: string) => {
    if (!isValidElement(child)) return

    if (isDiagramNodeElement(child)) {
      const props = child.props as DiagramNodeProps
      const nextParentId = props.parentId ?? parentId
      nodes.push({
        id: props.id,
        label: props.label,
        type: props.kind,
        ...(nextParentId ? { parentId: nextParentId } : {}),
      })
      hints.set(props.id, { xs: props.xs, sm: props.sm, md: props.md })

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
      Children.forEach(child.props.children, (nested) => walk(nested, parentId))
      return
    }

    if (child.props?.children) {
      Children.forEach(child.props.children, (nested: ReactNode) => walk(nested, parentId))
    }
  }

  Children.forEach(Children.toArray(children), (child) => walk(child, undefined))

  return { nodes, edges, hints }
}
