export type User = {
  id: string
  email: string
  name: string
  role_id: string
  role_name: string
  status: number
  created_at: string
  updated_at: string
}

export type UserListResponse = {
  data: User[]
  meta: {
    limit: number
    offset: number
    total: number
  }
}

export type CreateUserInput = {
  email: string
  name: string
  password: string
  role_id: string
  status?: number
}

export type UpdateUserPatch = {
  email?: string
  name?: string
  password?: string
  role_id?: string
  status?: number
}
