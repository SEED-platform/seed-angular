import type { ColDef } from 'ag-grid-community'
import type { Cycle } from '@seed/api/cycle'
import type { Label } from '@seed/api/label'
import type { CurrentUser } from '@seed/api/user'

export type InventoryType = 'properties' | 'taxlots'
export type InventoryTypeGoal = 'properties' | 'taxlots' | 'goal'

export type FilterResponse = {
  cycle_id?: number;
  pagination?: InventoryPagination;
  results: Inventory[] | number[];
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

export type FiltersSorts = {
  sorts: string[];
  filters?: Record<string, unknown>;
}

export type DeleteParams = {
  orgId: number;
  viewIds: number[];
}

export type AgFilterResponse = {
  pagination: InventoryPagination;
  results: Inventory[];
  column_defs: ColDef[];
}

export type AgFilterModel = Record<string, AgFilter>

export type FilterType = 'contains' | 'notContains' | 'equals' | 'notEqual' | 'startsWith' | 'endsWith' | 'blank' | 'notBlank' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between'

export type AgFilter = {
  filterType?: string;
  filter?: string | number;
  filterTo?: string | number;
  type?: FilterType;
  contains?: AgFilter;
  operator?: 'OR' | 'AND';
  conditions?: AgFilter[];
}

export type FilterSortChip = {
  displayName: string;
  field: string;
  original: string;
}

export type InventoryDependencies = {
  cycles: Cycle[];
  profiles: Profile[];
  labels: Label[];
  currentUser: CurrentUser;
}
