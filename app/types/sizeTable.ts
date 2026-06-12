export interface SizeTable {
  id: number
  name: string
  headers: string[]
  rows: SizeTableRow[]
  sort: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SizeTableRow {
  cells: string[]
}

export interface SizeTableFormData {
  name: string
  headers: string[]
  rows: SizeTableRow[]
  sort?: number
  is_active?: boolean
}