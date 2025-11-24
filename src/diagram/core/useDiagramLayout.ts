import { useEffect, useState } from 'react'

import type { LayoutResult } from '../layout/elkLayoutEngine'
import { runElkLayout } from '../layout/elkLayoutEngine'
import { adaptLayoutToReactFlow } from './rfAdapter'
import type { GraphModel } from './graphModel'
import type { LayoutConfig } from '../api/types'
import type { UseCaseReactFlowEdge, UseCaseReactFlowNode } from '../types/graph'

type LayoutState = {
  nodes: UseCaseReactFlowNode[]
  edges: UseCaseReactFlowEdge[]
  isLoading: boolean
  error: Error | null
}

const initialState: LayoutState = {
  nodes: [],
  edges: [],
  isLoading: true,
  error: null,
}

export function useDiagramLayout(graph: GraphModel, config: LayoutConfig) {
  const [state, setState] = useState<LayoutState>(initialState)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const layout: LayoutResult = await runElkLayout(graph, config)
        if (cancelled) return
        const adapted = adaptLayoutToReactFlow(layout)
        setState({ nodes: adapted.nodes, edges: adapted.edges, isLoading: false, error: null })
      } catch (err) {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error('Unknown layout error')
        setState({ nodes: [], edges: [], isLoading: false, error })
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [config, graph])

  return state
}
