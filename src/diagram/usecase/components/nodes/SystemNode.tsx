import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function SystemNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  return (
    <div
      className="relative h-full w-full rounded-2xl border-2 border-dashed bg-slate-800/40 p-4 text-left text-slate-100"
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
      <Handle id="system-target" type="target" position={Position.Left} className="opacity-0" />
      <Handle id="system-source" type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}
