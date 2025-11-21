import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function ActorNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  return (
    <div
      className={`flex w-[120px] flex-col items-center gap-3 rounded-2xl border bg-white/80 px-3 py-4 text-slate-900 shadow-sm backdrop-blur ${
        selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : 'ring-1 ring-slate-200'
      }`}
    >
      {/* Minimal stickman icon to keep the actor visually distinct */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 shadow-inner">
        🧍
      </div>
      <div className="text-center text-sm font-semibold leading-tight">{data.label}</div>

      {/* Handles on both sides to support floating edges or manual connections */}
      <Handle id="actor-target" type="target" position={Position.Left} className="opacity-0" />
      <Handle id="actor-source" type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}
