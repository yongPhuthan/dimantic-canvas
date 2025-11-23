import type { NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'
import { SubgraphNodeModel } from './SubgraphNodeModel'

export function SystemNode(props: NodeProps<UseCaseReactFlowNode>) {
  return <SubgraphNodeModel {...props} />
}
