export type User = {
  id: string
  email: string
  name: string
  role_id: string
  role_name: string
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