import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function SystemNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const handleVisibility = selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

  const handleBase =
    'h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ' +
    handleVisibility

  return (
    <div
      className="group relative h-full w-full rounded-2xl border-2 border-dashed bg-slate-800/40 p-4 text-left text-slate-100"
      style={{ zIndex: 0 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={200}
        lineStyle={{ borderColor: '#1d9bf0', borderWidth: 2 }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: '#1d9bf0',
          border: '1px solid #0f6abf',
          boxShadow: '0 0 0 1px #d9eafd',
        }}
      />
      {/* Badge stays anchored to the top-left so the boundary name is always visible above edges. */}
      <div className="pointer-events-none absolute -top-4 left-3 flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-xs font-semibold shadow-lg">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-slate-100">{data.label}</span>
      </div>
      {/* Visible handles on all sides for flexible connections */}
      <Handle
        id="system-top"
        type="target"
        position={Position.Top}
        className={`${handleBase} -mt-1`}
      />
      <Handle
        id="system-right"
        type="source"
        position={Position.Right}
        className={`${handleBase} -mr-1`}
      />
      <Handle
        id="system-bottom"
        type="target"
        position={Position.Bottom}
        className={`${handleBase} -mb-1`}
      />
      <Handle
        id="system-left"
        type="source"
        position={Position.Left}
        className={`${handleBase} -ml-1`}
      />
    </div>
  )
}
