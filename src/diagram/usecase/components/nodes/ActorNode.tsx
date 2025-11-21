import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function ActorNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const handleVisibility = selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

  const handleBase =
    'h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ' +
    handleVisibility

  return (
    <div
      className={`group relative flex w-[120px] flex-col items-center gap-3 rounded-2xl border bg-white/80 px-3 py-4 text-slate-900 shadow-sm backdrop-blur ${
        selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : 'ring-1 ring-slate-200'
      }`}
    >
      {/* Minimal stickman icon to keep the actor visually distinct */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 shadow-inner">
        🧍
      </div>
      <div className="text-center text-sm font-semibold leading-tight">{data.label}</div>

      {/* Visible handles on all sides for flexible connections */}
      <Handle
        id="actor-top"
        type="target"
        position={Position.Top}
        className={`${handleBase} -mt-1`}
      />
      <Handle
        id="actor-right"
        type="source"
        position={Position.Right}
        className={`${handleBase} -mr-1`}
      />
      <Handle
        id="actor-bottom"
        type="target"
        position={Position.Bottom}
        className={`${handleBase} -mb-1`}
      />
      <Handle
        id="actor-left"
        type="source"
        position={Position.Left}
        className={`${handleBase} -ml-1`}
      />
    </div>
  )
}
