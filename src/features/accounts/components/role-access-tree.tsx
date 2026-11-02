import { subtreeKeys, type PermissionNode } from '../permissions'

type Props = {
  nodes: PermissionNode[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

/** Checkbox tree: a parent toggles its whole subtree and shows a dash when only some of it is on. */
export function RoleAccessTree({ nodes, value, onChange, disabled }: Props) {
  const selected = new Set(value)

  function toggle(keys: string[], on: boolean) {
    const next = new Set(selected)
    for (const k of keys) {
      if (on) next.add(k)
      else next.delete(k)
    }
    onChange([...next])
  }

  return (
    <ul className="flex flex-col gap-1">
      {nodes.map((node) => (
        <TreeNode key={node.label} node={node} selected={selected} toggle={toggle} disabled={disabled} />
      ))}
    </ul>
  )
}

type NodeProps = {
  node: PermissionNode
  selected: Set<string>
  toggle: (keys: string[], on: boolean) => void
  disabled?: boolean
}

function TreeNode({ node, selected, toggle, disabled }: NodeProps) {
  const keys = subtreeKeys(node)
  const on = keys.filter((k) => selected.has(k)).length
  const checked = on === keys.length
  const partial = on > 0 && !checked

  return (
    <li>
      <label className="flex items-center gap-2 py-1 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          ref={(el) => {
            if (el) el.indeterminate = partial
          }}
          checked={checked}
          disabled={disabled}
          onChange={(e) => toggle(keys, e.target.checked)}
        />
        <span className={node.children ? 'font-medium' : undefined}>{node.label}</span>
      </label>
      {node.children && (
        <ul className="ml-2 flex flex-col gap-1 border-l pl-4">
          {node.children.map((child) => (
            <TreeNode key={child.label} node={child} selected={selected} toggle={toggle} disabled={disabled} />
          ))}
        </ul>
      )}
    </li>
  )
}
