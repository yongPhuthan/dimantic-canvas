import { ReactFlowProvider } from '@xyflow/react'
import type { PropsWithChildren } from 'react'

export function DiagramCanvas({ children }: PropsWithChildren) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

DiagramCanvas.displayName = 'DiagramCanvas'
