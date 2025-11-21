import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function UseCaseNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  return (
    <div
      className={`flex w-[190px] flex-col items-center rounded-full border px-6 py-4 text-center text-slate-900 shadow-sm ${
        selected ? 'bg-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : 'bg-slate-50 ring-1 ring-slate-200'
      }`}
    >
      <div className="text-sm font-semibold leading-tight">{data.label}</div>

      {/* Hidden handles to let React Flow manage connections without visual noise */}
      <Handle id="usecase-target" type="target" position={Position.Left} className="opacity-0" />
      <Handle id="usecase-source" type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}
