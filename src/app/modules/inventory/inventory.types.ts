import type { ColDef } from 'ag-grid-community'

export type InventoryType = 'properties' | 'taxlots' | 'goal'

export type FilterResponse = {
  cycle_id: number;
  pagination: InventoryPagination;
  results: Inventory[];
  column_defs?: ColDef[];
}

export type InventoryPagination = {
  end: number;
  has_next: boolean;
  has_previous: boolean;
  num_pages: number;
  page: number;
  start: number;
  total: number;
}

export type Inventory = Record<string, unknown>

export type ProfilesResponse = {
  status: string;
  data: Profile[];
}

export type ProfileResponse = {
  status: string;
  data: Profile;
}

export type Profile = {
  id: number;
  inventory_type: number;
  name: string;
  profile_location: number;
  columns?: ProfileColumn[];
}

export type ProfileColumn = {
  id: number;
  pinned: boolean;
  order: number;
  column_name: string;
  table_name: string;
}

export type AgGridDataRow = {
  // dynamic columns
  [key: string]: unknown;
  // constant columns
  groups_indicator: boolean;
  id: number;
  merged_indicator: boolean;
  meters_exist_indicator: boolean;
  notes_count: number;
  related: unknown[];
}

export type AgGridParams = {
  data: AgGridDataRow;
}
