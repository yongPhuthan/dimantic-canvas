import { useMemo } from 'react'

import { buildGraphModel } from '../core/graphModel'
import { useDiagramLayout } from '../core/useDiagramLayout'
import { ReactFlowCanvas } from '../render/ReactFlowCanvas'
import type { DiagramLayoutProps } from './types'

export function DiagramLayout(props: DiagramLayoutProps) {
  const { children, algorithm = 'elk', direction = 'RIGHT', spacing = 2, padding = 56, grid = true, hierarchy = 'INCLUDE_CHILDREN' } = props

  const graph = useMemo(() => buildGraphModel(children), [children])

  const layoutConfig = useMemo(
    () => ({
      algorithm,
      direction,
      spacing,
      padding,
      grid,
      hierarchy,
    }),
    [algorithm, direction, grid, hierarchy, padding, spacing],
  )

  const { nodes, edges, isLoading, error } = useDiagramLayout(graph, layoutConfig)

  return <ReactFlowCanvas nodes={nodes} edges={edges} isLoading={isLoading} error={error} />
}

DiagramLayout.displayName = 'DiagramLayout'
