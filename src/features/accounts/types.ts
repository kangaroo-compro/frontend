export type Role = {
  id: string
  name: string
  access: string[]
  created_at: string
  updated_at: string
}

export type RoleInput = { name: string; access: string[] }
