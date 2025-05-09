import type { ColDef } from 'ag-grid-community'
import type { ValueGetterParams } from 'ag-grid-community'
import type { Column } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import type { Label } from '@seed/api/label'
import type { Scenario } from '@seed/api/scenario'
import type { CurrentUser } from '@seed/api/user'

export type InventoryDisplayType = 'Property' | 'Tax Lot'
export type InventoryStateType = 'PropertyState' | 'TaxLotState'
export type InventoryType = 'properties' | 'taxlots'
export type InventoryTypeGoal = 'properties' | 'taxlots' | 'goal'

export type FilterResponse = {
  cycle_id?: number;
  pagination?: InventoryPagination;
  results: State[] | number[];
  // results: Inventory[] | number[];
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
  inventory_type: number | 'Tax Lot' | 'Property';
  name: string;
  profile_location: number;
  columns?: ProfileColumn[];
}

export type NewProfileData = {
  name: string;
  profile_location: ProfileLocation;
  inventory_type: InventoryDisplayType;
  columns: Column[];
  derived_columns: Column[];
}

export type ProfileLocation = 'Detail View Profile' | 'List View Profile'

export type ProfileColumn = {
  column_name: string;
  display_name: string;
  id: number;
  name: string;
  order: number;
  pinned: boolean;
  table_name: string;
  selected?: boolean;
  derived_column?: number;
}

export type ProfileModalMode = 'create' | 'delete' | 'rename' | 'populate'

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
  results: State[];
  // results: Inventory[];
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

type AccessLevelInstance = {
  id: number;
  lft: number;
  rgt: number;
  tree_id: number;
  depth: number;
  name: string;
  path: Record<string, string>;
  organization: number;
}

export type GenericRelatedInventory = {
  cycle: Cycle;
  id: number;
  labels: number[];
  state: State;
  taxlot?: TaxLot;
  property?: Property;
}

export type GenericView = {
  cycle: Cycle;
  id: number;
  property_id?: number;
  taxlot_id?: number;
}

export type GenericViewsResponse = {
  status: string;
  property_views?: GenericView[];
  taxlot_views?: GenericView[];
}

// could combine property and taxlot into a generic Inventory type
export type Property = {
  access_level_instance: AccessLevelInstance;
  created: string;
  group_mappings: GroupMapping[];
  id: number;
  inventory_documents: InventoryDocument[];
  organization: number;
  parent_property: unknown;
  updated: string;
}

export type TaxLot = {
  access_level_instance: AccessLevelInstance;
  created: string;
  id: number;
  organization: number;
  updated: string;
}

export type ViewResponse = {
  changed_fields: unknown;
  cycle: Cycle;
  date_edited: number;
  filename: string;
  history: History[];
  labels: number[];
  property?: Property;
  properties?: GenericRelatedInventory[];
  source: unknown;
  state: State;
  status: string;
  taxlot?: TaxLot;
  taxlots?: GenericRelatedInventory[];
}

type History = {
  date_edited: number;
  file: string;
  filename: string;
  source: string;
  state: State;
}

export type ValueGetterParamsData = ValueGetterParams<Record<string, unknown>>

export type GroupMapping = {
  group_id: number;
  group_name: string;
  id: number;
  property_id: number;
  taxlot_id: number;
}

export type InventoryDocument = {
  created: string;
  file: string;
  file_type: string;
  filename: string;
  id: number;
  property?: number;
  taxlot?: number;
}

export type BuildingFile = {
  created: string;
  file: string;
  file_type: string;
  filename: string;
  id: number;
  modified: string;
  organization_id: number | null;
  property_state: number;
}

export type State = {
  [key: string]: unknown;
  id: number;
  bounding_box: string;
  centroid: string;
  derived_data: Record<string, unknown>;
  extra_data: Record<string, unknown>;
  files: BuildingFile[];
  labels: number[];
  measures: Record<string, unknown>[];
  related?: State[];
  scenarios: Scenario[];
}

export type UpdateInventoryResponse = {
  match_link_count: number;
  match_merged_count: number;
  state: State;
  status: string;
  view_id: number;
}

export type PropertyDocumentType = 'application/pdf' | 'application/dxf' | 'text/plain' | 'application/octet-stream'
export type PropertyDocumentExtension = 'PDF' | 'DXF' | 'IDF' | 'OSM'

export type CrossCyclesResponse = Record<string, Record<string, unknown>[]>
