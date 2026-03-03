export type FilterGroupInventoryType = 'Property' | 'Tax Lot'

// TODO there are more fields returned that could be added here
export type FilterGroup = {
  id: number;
  name: string;
  organization_id: number;
  inventory_type: FilterGroupInventoryType;
}

// TODO this has unhandled pagination
export type FilterGroupsResponse = {
  status: string;
  data: FilterGroup[];
}
