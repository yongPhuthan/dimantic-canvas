import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function UseCaseNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const handleVisibility = selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

  const handleBase =
    'h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ' +
    handleVisibility

  return (
    <div
      className={`group relative flex w-[190px] flex-col items-center rounded-full border px-6 py-4 text-center text-slate-900 shadow-sm ${
        selected ? 'bg-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : 'bg-slate-50 ring-1 ring-slate-200'
      }`}
    >
      <div className="text-sm font-semibold leading-tight">{data.label}</div>

      {/* Visible handles on all sides for flexible connections */}
      <Handle
        id="usecase-top"
        type="target"
        position={Position.Top}
        className={`${handleBase} -mt-1`}
      />
      <Handle
        id="usecase-right"
        type="source"
        position={Position.Right}
        className={`${handleBase} -mr-1`}
      />
      <Handle
        id="usecase-bottom"
        type="target"
        position={Position.Bottom}
        className={`${handleBase} -mb-1`}
      />
      <Handle
        id="usecase-left"
        type="source"
        position={Position.Left}
        className={`${handleBase} -ml-1`}
      />
    </div>
  )
}
