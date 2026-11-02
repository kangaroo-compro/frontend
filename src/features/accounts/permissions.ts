/** The permission catalog is fixed; it mirrors internal/domain/role.go in the Manager. */
export const PERMISSIONS = {
  dashboard: 'monitoring.dashboard',
  dashboardExport: 'monitoring.dashboard.export',
  history: 'monitoring.history',
  report: 'monitoring.report',
  reportGenerate: 'monitoring.report.generate',
  turnMachine: 'monitoring.control.turnmachine',
  machineRead: 'settings.machine.read',
  machineCreate: 'settings.machine.create',
  machineUpdate: 'settings.machine.update',
  machineDelete: 'settings.machine.delete',
  userRead: 'settings.profile.read',
  userCreate: 'settings.profile.create',
  userUpdate: 'settings.profile.update',
  userDelete: 'settings.profile.delete',
  roleRead: 'settings.role.read',
  roleCreate: 'settings.role.create',
  roleUpdate: 'settings.role.update',
  roleDelete: 'settings.role.delete',
} as const

/** A node with a key is a permission; a node without one only groups its children. */
export type PermissionNode = { label: string; key?: string; children?: PermissionNode[] }

const crud = (label: string, keys: [string, string, string, string]): PermissionNode => ({
  label,
  children: [
    { label: 'View', key: keys[0] },
    { label: 'Add', key: keys[1] },
    { label: 'Edit', key: keys[2] },
    { label: 'Delete', key: keys[3] },
  ],
})

export const PERMISSION_TREE: PermissionNode[] = [
  {
    label: 'Monitoring',
    children: [
      {
        label: 'Dashboard',
        key: PERMISSIONS.dashboard,
        children: [{ label: 'Export data', key: PERMISSIONS.dashboardExport }],
      },
      { label: 'History', key: PERMISSIONS.history },
      {
        label: 'Report',
        key: PERMISSIONS.report,
        children: [{ label: 'Generate & download', key: PERMISSIONS.reportGenerate }],
      },
      { label: 'Control', children: [{ label: 'Turn machine ON/OFF', key: PERMISSIONS.turnMachine }] },
    ],
  },
  {
    label: 'Settings',
    children: [
      crud('Machines', [PERMISSIONS.machineRead, PERMISSIONS.machineCreate, PERMISSIONS.machineUpdate, PERMISSIONS.machineDelete]),
      crud('Users', [PERMISSIONS.userRead, PERMISSIONS.userCreate, PERMISSIONS.userUpdate, PERMISSIONS.userDelete]),
      crud('Roles', [PERMISSIONS.roleRead, PERMISSIONS.roleCreate, PERMISSIONS.roleUpdate, PERMISSIONS.roleDelete]),
    ],
  },
]

/** Every permission key at or below the node. */
export function subtreeKeys(node: PermissionNode): string[] {
  return [...(node.key ? [node.key] : []), ...(node.children ?? []).flatMap(subtreeKeys)]
}
