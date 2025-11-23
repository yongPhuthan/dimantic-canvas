import type { NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'
import { NodeModel } from './NodeModel'

export function ActorNode(props: NodeProps<UseCaseReactFlowNode>) {
  return <NodeModel {...props} />
}
